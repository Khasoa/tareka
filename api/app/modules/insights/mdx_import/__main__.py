from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.modules.insights.mdx_import.paths import (
    DEFAULT_CONTENT_DIR,
    DEFAULT_PUBLIC_DIR,
    DEFAULT_REPORT_DIR,
)
from app.modules.insights.mdx_import.runner import import_mdx_articles, write_reports


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="One-time import of Insights MDX articles into PostgreSQL CMS tables.",
    )
    parser.add_argument(
        "--content-dir",
        type=Path,
        default=DEFAULT_CONTENT_DIR,
        help="Directory containing *.mdx source files.",
    )
    parser.add_argument(
        "--public-dir",
        type=Path,
        default=DEFAULT_PUBLIC_DIR,
        help="Next.js public/ directory for featured image assets.",
    )
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=DEFAULT_REPORT_DIR,
        help="Directory where JSON/Markdown reports are written.",
    )
    parser.add_argument(
        "--database-url",
        type=str,
        default="",
        help="Override DATABASE_URL (defaults to app settings).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Analyse and report without writing to the database or uploading images.",
    )
    parser.add_argument(
        "--confirm-overwrite-existing",
        action="store_true",
        help=(
            "Allow replacing an existing row only when its version is still 1. "
            "Normal runs never overwrite."
        ),
    )
    parser.add_argument(
        "--upload-images",
        action="store_true",
        help="Upload featured images to configured R2 storage (requires credentials).",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    database_url = args.database_url.strip() or settings.database_url

    engine = create_engine(database_url)
    session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    report = None
    try:
        with session_factory() as session:
            report = import_mdx_articles(
                session,
                content_dir=args.content_dir,
                public_dir=args.public_dir,
                dry_run=args.dry_run,
                confirm_overwrite_existing=args.confirm_overwrite_existing,
                upload_images=args.upload_images,
            )
    except Exception as exc:
        if not args.dry_run:
            raise
        print(
            f"Database unavailable ({exc}); running offline dry-run.", file=sys.stderr
        )
        report = import_mdx_articles(
            None,
            content_dir=args.content_dir,
            public_dir=args.public_dir,
            dry_run=True,
            confirm_overwrite_existing=False,
            upload_images=False,
        )

    write_reports(report, args.report_dir)

    print(f"Discovered {len(report.discovered_files)} MDX file(s).")
    for item in report.results:
        print(f"- {item.slug}: {item.status} — {item.message}")
    for error in report.errors:
        print(f"ERROR: {error}", file=sys.stderr)

    print(f"Reports written to {args.report_dir}")
    return 0 if not report.errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
