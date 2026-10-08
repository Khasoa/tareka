from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.validation import validate_http_url


class SuggestionCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=200,
    )

    county: str = Field(
        min_length=2,
        max_length=100,
    )

    description_raw: str | None = Field(
        default=None,
        max_length=1000,
    )

    materials_raw: str | None = Field(
        default=None,
        max_length=300,
    )

    source_url: str = Field(
        min_length=5,
        max_length=500,
    )

    phone: str | None = Field(
        default=None,
        max_length=50,
    )

    submitter_note: str | None = Field(
        default=None,
        max_length=500,
    )

    submitter_email: str | None = Field(
        default=None,
        max_length=200,
    )

    honeypot: str = Field(
        default="",
        max_length=64,
    )

    @field_validator("source_url")
    @classmethod
    def validate_source_url(cls, value: str) -> str:
        validated = validate_http_url(value)

        if validated is None:
            raise ValueError("Source URL is required")

        return validated


class SuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    county: str
    description_raw: str | None
    materials_raw: str | None
    source_url: str
    phone: str | None
    submitter_note: str | None
    submitter_email: str | None
    status: str
    created_at: datetime
