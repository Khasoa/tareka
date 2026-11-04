from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.insights.document import validate_article_slug

ArticleStatus = Literal["draft", "published"]


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    sort_order: int
    is_active: bool


class PublicArticleSummary(BaseModel):
    slug: str
    title: str
    excerpt: str
    category: str
    published_at: date
    featured_image_url: str | None = None
    featured_image_alt: str | None = None
    featured_image_caption: str | None = None
    seo_title: str | None = None
    meta_description: str | None = None


class PublicArticleDetail(PublicArticleSummary):
    body_json: dict[str, Any]


class PublicArticleListResponse(BaseModel):
    items: list[PublicArticleSummary]
    page: int
    page_size: int
    total: int
    total_pages: int


class AdminArticleSummary(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: str
    status: ArticleStatus
    category_id: int | None
    category_name: str | None
    published_at: date | None
    version: int
    updated_at: datetime
    featured_image_key: str | None
    featured_image_alt: str | None


class AdminArticleDetail(AdminArticleSummary):
    body_json: dict[str, Any]
    featured_image_caption: str | None
    seo_title: str | None
    meta_description: str | None
    featured_image_url: str | None = None
    created_at: datetime
    save_notices: list[str] = Field(default_factory=list)


class AdminArticleListResponse(BaseModel):
    items: list[AdminArticleSummary]
    page: int
    page_size: int
    total: int
    total_pages: int


class AdminArticleCreate(BaseModel):
    slug: str | None = Field(default=None, max_length=220)
    title: str = Field(default="", max_length=300)
    category_id: int | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return validate_article_slug(value)


class AdminArticleUpdate(BaseModel):
    version: int = Field(ge=1)
    slug: str | None = Field(default=None, max_length=220)
    title: str | None = Field(default=None, max_length=300)
    excerpt: str | None = Field(default=None, max_length=2000)
    category_id: int | None = None
    body_json: dict[str, Any] | None = None
    published_at: date | None = None
    featured_image_key: str | None = Field(default=None, max_length=500)
    featured_image_alt: str | None = Field(default=None, max_length=300)
    featured_image_caption: str | None = Field(default=None, max_length=500)
    seo_title: str | None = Field(default=None, max_length=300)
    meta_description: str | None = Field(default=None, max_length=500)
    allow_empty_body: bool = False

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return validate_article_slug(value)


class AdminArticlePublish(BaseModel):
    version: int = Field(ge=1)
    published_at: date | None = None


class AdminArticleUnpublish(BaseModel):
    version: int = Field(ge=1)


class FeaturedImageUploadResponse(BaseModel):
    storage_key: str
    public_url: str
    width: int
    height: int
    content_type: str
