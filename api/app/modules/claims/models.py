from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BusinessClaim(Base):
    __tablename__ = "business_claims"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"))
    claimant_name: Mapped[str] = mapped_column(String(200))
    claimant_role: Mapped[str] = mapped_column(String(50))
    claimant_contact: Mapped[str] = mapped_column(String(200))
    correction_note: Mapped[str | None] = mapped_column(Text)
    editorial_consent: Mapped[bool] = mapped_column(default=False)
    image_consent: Mapped[bool] = mapped_column(default=False)
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
    )
    submitted_at: Mapped[datetime] = mapped_column(server_default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
