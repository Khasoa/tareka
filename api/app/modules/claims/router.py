from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.deps import DbSession
from app.core.rate_limit import limiter
from app.modules.admin.audit import record_audit
from app.modules.admin.models import AdminUser
from app.modules.admin.service import require_admin
from app.modules.claims.models import BusinessClaim
from app.modules.directory.models import Business

router = APIRouter(prefix="/api", tags=["claims"])


class ClaimCreate(BaseModel):
    claimant_name: str = Field(min_length=2, max_length=200)
    claimant_role: str = Field(min_length=2, max_length=50)
    claimant_contact: str = Field(min_length=3, max_length=200)
    correction_note: str | None = Field(default=None, max_length=1000)
    content_use_consent: bool
    image_consent: bool = False
    honeypot: str = Field(default="", max_length=0)


def _claim_payload(claim: BusinessClaim, business: Business) -> dict:
    return {
        "id": claim.id,
        "business_id": claim.business_id,
        "business_name": business.name,
        "business_slug": business.slug,
        "claimant_name": claim.claimant_name,
        "claimant_role": claim.claimant_role,
        "claimant_contact": claim.claimant_contact,
        "correction_note": claim.correction_note,
        "content_use_consent": claim.content_use_consent,
        "image_consent": claim.image_consent,
        "status": claim.status,
        "submitted_at": claim.submitted_at,
        "reviewed_at": claim.reviewed_at,
    }


@router.post("/businesses/{business_id}/claims")
@limiter.limit("5/hour")
def create_claim(
    business_id: int,
    request: Request,
    body: ClaimCreate,
    db: DbSession,
) -> dict[str, str]:
    if body.honeypot:
        return {"status": "ok"}

    if not body.content_use_consent:
        raise HTTPException(
            status_code=400,
            detail="Content-use consent is required to submit this claim.",
        )

    business = db.get(Business, business_id)
    if business is None or not business.is_active:
        raise HTTPException(status_code=404, detail="Business not found")

    claim = BusinessClaim(
        business_id=business_id,
        claimant_name=body.claimant_name.strip(),
        claimant_role=body.claimant_role.strip(),
        claimant_contact=body.claimant_contact.strip(),
        correction_note=body.correction_note,
        content_use_consent=body.content_use_consent,
        image_consent=body.image_consent,
        status="pending",
    )

    db.add(claim)
    db.commit()

    return {"status": "ok"}


@router.get("/admin/claims")
def list_claims(
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> list[dict]:
    rows = db.execute(
        select(BusinessClaim, Business)
        .join(Business, Business.id == BusinessClaim.business_id)
        .order_by(BusinessClaim.submitted_at.desc())
    ).all()

    return [_claim_payload(claim, business) for claim, business in rows]


@router.post("/admin/claims/{claim_id}/approve")
def approve_claim(
    claim_id: int,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> dict[str, str]:
    claim = db.get(BusinessClaim, claim_id)
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="This claim has already been reviewed.",
        )

    business = db.get(Business, claim.business_id)
    if business is None:
        raise HTTPException(
            status_code=404,
            detail="The claimed business no longer exists.",
        )

    before = {
        "content_use_consent": business.content_use_consent,
        "image_consent": business.image_consent,
        "verification_status": business.verification_status,
    }

    business.content_use_consent = claim.content_use_consent
    business.image_consent = claim.image_consent

    # A correction request is a review flag, not permission to edit
    # canonical business data automatically.
    if claim.correction_note and claim.correction_note.strip():
        business.verification_status = "needs_review"

    claim.status = "approved"
    claim.reviewed_at = datetime.now(UTC)

    after = {
        "content_use_consent": business.content_use_consent,
        "image_consent": business.image_consent,
        "verification_status": business.verification_status,
        "claim_status": claim.status,
        "correction_note": claim.correction_note,
    }

    record_audit(
        db,
        admin_id=admin.id,
        action="approve_claim",
        entity="business_claim",
        entity_id=claim.id,
        before=before,
        after=after,
    )

    db.commit()
    return {"status": "approved"}


@router.post("/admin/claims/{claim_id}/reject")
def reject_claim(
    claim_id: int,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> dict[str, str]:
    claim = db.get(BusinessClaim, claim_id)
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="This claim has already been reviewed.",
        )

    claim.status = "rejected"
    claim.reviewed_at = datetime.now(UTC)

    record_audit(
        db,
        admin_id=admin.id,
        action="reject_claim",
        entity="business_claim",
        entity_id=claim.id,
        before={"status": "pending"},
        after={"status": "rejected"},
    )

    db.commit()
    return {"status": "rejected"}
