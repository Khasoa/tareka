from pydantic import BaseModel, Field


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
        max_length=2000,
    )

    content_use_consent: bool = False

    image_consent: bool = False

    honeypot: str = Field(
        default="",
        max_length=0,
    )
