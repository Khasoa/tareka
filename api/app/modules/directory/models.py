from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False)

    business_type: Mapped[str] = mapped_column(String(30), nullable=False)
    accepts_public_dropoff: Mapped[str] = mapped_column(
        String(20), nullable=False, default="unknown"
    )

    verification_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="unverified"
    )
    last_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    source_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)

    editorial_consent: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    image_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    locations: Mapped[list["Location"]] = relationship(
        back_populates="business", cascade="all, delete-orphan"
    )
    materials: Mapped[list["BusinessMaterial"]] = relationship(
        back_populates="business", cascade="all, delete-orphan"
    )
    verification_records: Mapped[list["VerificationRecord"]] = relationship(
        back_populates="business", cascade="all, delete-orphan"
    )


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"), nullable=False
    )
    county: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    town: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)

    business: Mapped["Business"] = relationship(back_populates="locations")


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("materials.id"), nullable=True
    )

    businesses: Mapped[list["BusinessMaterial"]] = relationship(
        back_populates="material"
    )


class BusinessMaterial(Base):
    __tablename__ = "business_materials"

    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"), primary_key=True
    )
    material_id: Mapped[int] = mapped_column(
        ForeignKey("materials.id"), primary_key=True
    )

    business: Mapped["Business"] = relationship(back_populates="materials")
    material: Mapped["Material"] = relationship(back_populates="businesses")


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    source_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    business: Mapped["Business"] = relationship(back_populates="verification_records")
