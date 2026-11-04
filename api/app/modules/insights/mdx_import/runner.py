from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.insights.mdx_import.analyze import analyze_mdx_body, findings_to_dict
from app.modules.insights.mdx_import.frontmatter import (
    FrontmatterError,
    discover_mdx_files,
    parse_mdx_file,
)
from app.modules.insights.mdx_import.images import (
    featured_image_plan_to_dict,
    plan_featured_image,
)
from app.modules.insights.mdx_import.markdown_to_document import (
    markdown_body_to_document,
)
from app.modules.insights.models import InsightArticle, InsightCategory


@dataclass
class ArticleImportResult:
    filename: str
    slug: str
    status: str
    message: str
    frontmatter: dict[str, object] = field(default_factory=dict)
    conversion_notes: list[dict[str, object]] = field(default_factory=list)
    unsupported_findings: list[dict[str, object]] = field(default_factory=list)
    featured_image: dict[str, object | None] = field(default_factory=dict)
    body_node_count: int = 0


@dataclass
class ImportRunReport:
    started_at: str
    dry_run: bool
    confirm_overwrite_existing: bool
    upload_images: bool
    content_dir: str
    discovered_files: list[str]
    results: list[ArticleImportResult] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def seed_insight_categories(session: Session) -> None:
    existing = session.scalar(select(InsightCategory.id).limit(1))
    if existing is not None:
        return
    session.add_all(
        [
            InsightCategory(
                slug="foundations",
                name="Foundations",
                sort_order=1,
                is_active=True,
            ),
            InsightCategory(
                slug="recovery-in-practice",
                name="Recovery in Practice",
                sort_order=2,
                is_active=True,
            ),
            InsightCategory(
                slug="material-explorations",
                name="Material Explorations",
                sort_order=3,
                is_active=True,
            ),
        ]
    )
    session.flush()


def _resolve_category_id(session: Session, category_name: str) -> int | None:
    normalized = category_name.strip().lower()
    categories = session.scalars(select(InsightCategory)).all()
    for category in categories:
        if category.name.strip().lower() == normalized:
            return category.id
        if category.slug == normalized.replace(" ", "-"):
            return category.id
    return None


def _node_count(document: dict) -> int:
    count = 0

    def walk(node: object) -> None:
        nonlocal count
        if isinstance(node, dict):
            count += 1
            content = node.get("content")
            if isinstance(content, list):
                for child in content:
                    walk(child)

    walk(document)
    return count


def import_mdx_articles(
    session: Session | None,
    *,
    content_dir: Path,
    public_dir: Path,
    dry_run: bool,
    confirm_overwrite_existing: bool,
    upload_images: bool,
) -> ImportRunReport:
    report = ImportRunReport(
        started_at=datetime.now(UTC).isoformat(),
        dry_run=dry_run,
        confirm_overwrite_existing=confirm_overwrite_existing,
        upload_images=upload_images,
        content_dir=str(content_dir),
        discovered_files=[],
    )

    files = discover_mdx_files(content_dir)
    report.discovered_files = [path.name for path in files]

    if not dry_run and session is None:
        raise ValueError("Database session is required for non-dry-run imports.")

    if session is not None and not dry_run:
        seed_insight_categories(session)

    for path in files:
        try:
            parsed = parse_mdx_file(path)
        except (FrontmatterError, ValueError) as exc:
            report.errors.append(f"{path.name}: {exc}")
            continue

        slug = parsed.frontmatter["slug"]
        unsupported = analyze_mdx_body(parsed.body)
        try:
            body_json, notes = markdown_body_to_document(parsed.body)
        except Exception as exc:  # noqa: BLE001 - import boundary
            report.results.append(
                ArticleImportResult(
                    filename=parsed.filename,
                    slug=slug,
                    status="failed",
                    message=str(exc),
                    unsupported_findings=findings_to_dict(unsupported),
                )
            )
            continue

        featured_plan = plan_featured_image(
            public_dir=public_dir,
            cover_image=parsed.frontmatter.get("cover_image"),
            image_alt=parsed.frontmatter.get("image_alt"),
            upload=upload_images,
            dry_run=dry_run,
        )

        category_id = None
        if session is not None and not dry_run:
            category_id = _resolve_category_id(
                session,
                str(parsed.frontmatter["category"]),
            )
            if category_id is None:
                report.results.append(
                    ArticleImportResult(
                        filename=parsed.filename,
                        slug=slug,
                        status="failed",
                        message=(
                            f'Unknown category "{parsed.frontmatter["category"]}". '
                            "Seed insight_categories before import."
                        ),
                        frontmatter={
                            key: (
                                value.isoformat()
                                if hasattr(value, "isoformat")
                                else value
                            )
                            for key, value in parsed.frontmatter.items()
                        },
                        conversion_notes=[asdict(note) for note in notes],
                        unsupported_findings=findings_to_dict(unsupported),
                        featured_image=featured_image_plan_to_dict(featured_plan),
                        body_node_count=_node_count(body_json),
                    )
                )
                continue

        existing = None
        if session is not None:
            existing = session.scalar(
                select(InsightArticle).where(InsightArticle.slug == slug)
            )

        article_result = ArticleImportResult(
            filename=parsed.filename,
            slug=slug,
            status="pending",
            message="",
            frontmatter={
                key: (value.isoformat() if hasattr(value, "isoformat") else value)
                for key, value in parsed.frontmatter.items()
            },
            conversion_notes=[asdict(note) for note in notes],
            unsupported_findings=findings_to_dict(unsupported),
            featured_image=featured_image_plan_to_dict(featured_plan),
            body_node_count=_node_count(body_json),
        )

        if existing:
            if not confirm_overwrite_existing:
                article_result.status = "skipped_conflict"
                article_result.message = "Article slug already exists. Importer does not overwrite existing rows."
                report.results.append(article_result)
                continue
            if existing.version > 1:
                article_result.status = "failed"
                article_result.message = (
                    f"Refusing to overwrite slug {slug}: server version is "
                    f"{existing.version} (only version 1 may be replaced with "
                    "--confirm-overwrite-existing)."
                )
                report.results.append(article_result)
                continue

        if session is None:
            article_result.status = "dry_run_ready"
            article_result.message = "Would import as published article (offline dry-run — no DB conflict check)."
            report.results.append(article_result)
            continue

        if dry_run:
            article_result.status = "dry_run_ready"
            article_result.message = "Would import as published article."
            report.results.append(article_result)
            continue

        published_at = parsed.frontmatter["published_at"]
        payload = {
            "title": parsed.frontmatter["title"],
            "excerpt": parsed.frontmatter["excerpt"],
            "category_id": category_id,
            "body_json": body_json,
            "status": "published",
            "published_at": published_at,
            "seo_title": parsed.frontmatter.get("seo_title"),
            "meta_description": parsed.frontmatter.get("meta_description"),
            "featured_image_key": featured_plan.storage_key,
            "featured_image_alt": parsed.frontmatter.get("image_alt"),
            "featured_image_caption": None,
        }

        if existing and confirm_overwrite_existing and existing.version == 1:
            existing.title = payload["title"]
            existing.excerpt = payload["excerpt"]
            existing.category_id = payload["category_id"]
            existing.body_json = payload["body_json"]
            existing.status = "published"
            existing.published_at = payload["published_at"]
            existing.seo_title = payload["seo_title"]
            existing.meta_description = payload["meta_description"]
            existing.featured_image_key = payload["featured_image_key"]
            existing.featured_image_alt = payload["featured_image_alt"]
            existing.featured_image_caption = payload["featured_image_caption"]
            existing.version += 1
            existing.updated_at = datetime.now(UTC)
            article_result.status = "updated"
            article_result.message = (
                "Existing version-1 article replaced from MDX source."
            )
        else:
            session.add(
                InsightArticle(
                    slug=slug,
                    title=payload["title"],
                    excerpt=payload["excerpt"],
                    category_id=payload["category_id"],
                    body_json=payload["body_json"],
                    status="published",
                    published_at=payload["published_at"],
                    seo_title=payload["seo_title"],
                    meta_description=payload["meta_description"],
                    featured_image_key=payload["featured_image_key"],
                    featured_image_alt=payload["featured_image_alt"],
                    featured_image_caption=payload["featured_image_caption"],
                    version=1,
                )
            )
            article_result.status = "imported"
            article_result.message = "Article imported as published."

        report.results.append(article_result)

    if session is not None and not dry_run:
        session.commit()

    return report


def write_reports(report: ImportRunReport, report_dir: Path) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)

    summary = {
        "started_at": report.started_at,
        "dry_run": report.dry_run,
        "confirm_overwrite_existing": report.confirm_overwrite_existing,
        "upload_images": report.upload_images,
        "content_dir": report.content_dir,
        "discovered_count": len(report.discovered_files),
        "discovered_files": report.discovered_files,
        "imported": sum(item.status == "imported" for item in report.results),
        "updated": sum(item.status == "updated" for item in report.results),
        "skipped_conflict": sum(
            item.status == "skipped_conflict" for item in report.results
        ),
        "dry_run_ready": sum(item.status == "dry_run_ready" for item in report.results),
        "failed": sum(item.status == "failed" for item in report.results),
        "errors": report.errors,
    }

    article_report = [asdict(item) for item in report.results]
    unsupported_report = [
        {
            "filename": item.filename,
            "slug": item.slug,
            "findings": item.unsupported_findings,
        }
        for item in report.results
    ]
    image_report = [
        {
            "filename": item.filename,
            "slug": item.slug,
            "featured_image": item.featured_image,
        }
        for item in report.results
    ]

    (report_dir / "import-summary.json").write_text(
        json.dumps(summary, indent=2),
        encoding="utf-8",
    )
    (report_dir / "article-conversion-report.json").write_text(
        json.dumps(article_report, indent=2),
        encoding="utf-8",
    )
    (report_dir / "unsupported-constructs-report.json").write_text(
        json.dumps(unsupported_report, indent=2),
        encoding="utf-8",
    )
    (report_dir / "featured-image-report.json").write_text(
        json.dumps(image_report, indent=2),
        encoding="utf-8",
    )

    manual_lines = ["# Manual conversion work", ""]
    for item in report.results:
        manual = [
            finding
            for finding in item.unsupported_findings
            if finding.get("disposition") in {"manual_review_required", "omitted"}
        ]
        if manual:
            manual_lines.append(f"## {item.slug} ({item.filename})")
            for finding in manual:
                manual_lines.append(
                    f"- **{finding['kind']}** lines {finding['line_start']}-{finding['line_end']}: "
                    f"{finding['recommendation']}",
                )
            manual_lines.append("")

    (report_dir / "manual-conversion-work.md").write_text(
        "\n".join(manual_lines),
        encoding="utf-8",
    )
