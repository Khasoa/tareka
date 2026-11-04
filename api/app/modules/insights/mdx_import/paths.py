from __future__ import annotations

from pathlib import Path

# api/app/modules/insights/mdx_import/paths.py → repo root is five levels up.
REPO_ROOT = Path(__file__).resolve().parents[5]
DEFAULT_CONTENT_DIR = REPO_ROOT / "web" / "content" / "insights"
DEFAULT_PUBLIC_DIR = REPO_ROOT / "web" / "public"
DEFAULT_REPORT_DIR = REPO_ROOT / "api" / "reports" / "insights-mdx-import"
