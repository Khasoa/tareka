from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BusinessClaim(Base):
    __tablename__ = "business_claims"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"), nullable=False, index=True
    )
    claimant_name: Mapped[str] = mapped_column(String(200), nullable=False)
    claimant_role: Mapped[str] = mapped_column(String(50), nullable=False)
    claimant_contact: Mapped[str] = mapped_column(String(200), nullable=False)
    correction_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    content_use_consent: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    image_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
