from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    county: str
    town: str | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None


class MaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    parent_id: int | None = None


class BusinessListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    business_type: str
    accepts_public_dropoff: str
    verification_status: str
    last_verified_at: datetime | None = None
    locations: list[LocationResponse] = []


class BusinessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    business_type: str
    accepts_public_dropoff: str
    verification_status: str
    last_verified_at: datetime | None = None
    description: str | None = None
    website_url: str | None = None
    phone: str | None = None
    email: str | None = None
    locations: list[LocationResponse] = []
    materials: list[MaterialResponse] = []
    created_at: datetime
    updated_at: datetime


class BusinessListResponse(BaseModel):
    items: list[BusinessListItem]
    page: int
    page_size: int
    total: int
    total_pages: int
