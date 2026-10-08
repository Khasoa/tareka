from pydantic import BaseModel, Field


class SuggestionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    county: str = Field(min_length=2, max_length=100)
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
        max_length=0,
    )
