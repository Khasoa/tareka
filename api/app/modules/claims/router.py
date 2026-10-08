from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.deps import DbSession
from app.core.rate_limit import limiter
from app.modules.admin.audit import record_audit
from app.modules.admin.service import require_admin
from app.modules.claims.models import BusinessClaim
from app.modules.directory.models import Business

router = APIRouter(prefix="/api", tags=["claims"])


class ClaimCreate(BaseModel):
    claimant_name: str = Field(
        min_length=2,
        max_length=200,
    )
    claimant_role: str = Field(
        min_length=2,
        max_length=50,
    )
    claimant_contact: str = Field(
        min_length=3,
        max_length=200,
    )
    correction_note: str | None = Field(
        default=None,
        max_length=1000,
    )
    consent: bool
    image_consent: bool = False
    honeypot: str = Field(
        default="",
        max_length=0,
    )


@router.post("/businesses/{business_id}/claims")
@limiter.limit("5/hour")
def create_claim(
    request: Request,
    business_id: int,
    body: ClaimCreate,
    db: DbSession,
):
    if body.honeypot:
        return {"status": "ok"}

    if not body.consent:
        raise HTTPException(
            status_code=400,
            detail="Consent is required to submit a claim",
        )

    business = db.get(Business, business_id)

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found",
        )

    claim = BusinessClaim(
        business_id=business_id,
        claimant_name=body.claimant_name,
        claimant_role=body.claimant_role,
        claimant_contact=body.claimant_contact,
        correction_note=body.correction_note,
        editorial_consent=body.consent,
        image_consent=body.image_consent,
    )

    db.add(claim)
    db.commit()

    return {"status": "ok"}


@router.get("/admin/claims")
def list_claims(
    db: DbSession,
    admin=Depends(require_admin),
):
    return db.scalars(
        select(BusinessClaim).order_by(BusinessClaim.submitted_at.desc())
    ).all()


@router.post("/admin/claims/{claim_id}/approve")
def approve_claim(
    claim_id: int,
    db: DbSession,
    admin=Depends(require_admin),
):
    claim = db.get(BusinessClaim, claim_id)

    if not claim or claim.status != "pending":
        raise HTTPException(
            status_code=404,
            detail="Claim not found or already reviewed",
        )

    business = db.get(Business, claim.business_id)

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found",
        )

    before = {
        "verification_status": business.verification_status,
        "editorial_consent": business.editorial_consent,
        "image_consent": business.image_consent,
    }

    business.editorial_consent = claim.editorial_consent
    business.image_consent = claim.image_consent

    if claim.correction_note:
        business.verification_status = "needs_review"

    claim.status = "approved"
    claim.reviewed_at = datetime.now(UTC)

    after = {
        "verification_status": business.verification_status,
        "editorial_consent": business.editorial_consent,
        "image_consent": business.image_consent,
    }

    record_audit(
        db,
        admin.id,
        "APPROVE_CLAIM",
        "business_claim",
        claim.id,
        before,
        after,
    )

    db.commit()

    return {"status": "ok"}


@router.post("/admin/claims/{claim_id}/reject")
def reject_claim(
    claim_id: int,
    db: DbSession,
    admin=Depends(require_admin),
):
    claim = db.get(BusinessClaim, claim_id)

    if not claim or claim.status != "pending":
        raise HTTPException(
            status_code=404,
            detail="Claim not found or already reviewed",
        )

    claim.status = "rejected"
    claim.reviewed_at = datetime.now(UTC)

    record_audit(
        db,
        admin.id,
        "REJECT_CLAIM",
        "business_claim",
        claim.id,
        None,
        {"status": "rejected"},
    )

    db.commit()

    return {"status": "ok"}
