from datetime import datetime

from sqlalchemy import String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BusinessSuggestion(Base):
    __tablename__ = "business_suggestions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    county: Mapped[str] = mapped_column(String(100))
    description_raw: Mapped[str | None] = mapped_column(Text)
    materials_raw: Mapped[str | None] = mapped_column(String(300))
    source_url: Mapped[str] = mapped_column(String(500))
    phone: Mapped[str | None] = mapped_column(String(50))
    submitter_note: Mapped[str | None] = mapped_column(Text)
    submitter_email: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(
        String(20),
        default="new",
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
    )
