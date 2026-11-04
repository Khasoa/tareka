from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from enum import Enum


class Disposition(str, Enum):
    CONVERTED = "converted"
    OMITTED = "omitted"
    MANUAL_REVIEW = "manual_review_required"
    NOT_PRESENT = "not_present"


@dataclass(frozen=True)
class UnsupportedFinding:
    kind: str
    line_start: int
    line_end: int
    excerpt: str
    disposition: Disposition
    recommendation: str


_JSX_TAG = re.compile(r"<\s*[A-Z][A-Za-z0-9]*")
_HTML_TAG = re.compile(
    r"<\s*(?:img|table|div|span|iframe|script|style)\b", re.IGNORECASE
)
_MDX_EXPRESSION = re.compile(r"(?<![\\])\{[^{}\n]+\}")
_IMAGE_MARKDOWN = re.compile(r"!\[[^\]]*\]\([^)]+\)")
_FENCED_CODE = re.compile(r"^```", re.MULTILINE)
_TABLE_DIVIDER = re.compile(r"^\s*\|?\s*:?-{3,}")


def _line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def analyze_mdx_body(body: str) -> list[UnsupportedFinding]:
    findings: list[UnsupportedFinding] = []

    for match in _FENCED_CODE.finditer(body):
        start = _line_number(body, match.start())
        findings.append(
            UnsupportedFinding(
                kind="code_block",
                line_start=start,
                line_end=start,
                excerpt=body[match.start() : match.start() + 20].strip(),
                disposition=Disposition.MANUAL_REVIEW,
                recommendation=(
                    "Code blocks are not supported in the CMS editor. "
                    "Recreate as plain explanation or attach externally."
                ),
            )
        )

    for index, line in enumerate(body.splitlines(), start=1):
        if _TABLE_DIVIDER.match(line):
            findings.append(
                UnsupportedFinding(
                    kind="table",
                    line_start=max(1, index - 1),
                    line_end=index + 1,
                    excerpt=line.strip()[:120],
                    disposition=Disposition.MANUAL_REVIEW,
                    recommendation=(
                        "Tables are not supported. Convert to lists or paragraphs manually."
                    ),
                )
            )

    for match in _HTML_TAG.finditer(body):
        findings.append(
            UnsupportedFinding(
                kind="embedded_html",
                line_start=_line_number(body, match.start()),
                line_end=_line_number(body, match.end()),
                excerpt=match.group(0),
                disposition=Disposition.MANUAL_REVIEW,
                recommendation="Remove HTML and use supported formatting only.",
            )
        )

    for match in _JSX_TAG.finditer(body):
        findings.append(
            UnsupportedFinding(
                kind="jsx_component",
                line_start=_line_number(body, match.start()),
                line_end=_line_number(body, match.end()),
                excerpt=match.group(0),
                disposition=Disposition.OMITTED,
                recommendation=(
                    "MDX components (for example DirectoryCTA) are not stored in body_json. "
                    "DirectoryCTA is appended automatically on public CMS pages."
                ),
            )
        )

    for match in _MDX_EXPRESSION.finditer(body):
        findings.append(
            UnsupportedFinding(
                kind="mdx_expression",
                line_start=_line_number(body, match.start()),
                line_end=_line_number(body, match.end()),
                excerpt=match.group(0)[:80],
                disposition=Disposition.OMITTED,
                recommendation="Replace MDX expressions with static text.",
            )
        )

    for match in _IMAGE_MARKDOWN.finditer(body):
        src_match = re.search(r"\(([^)]+)\)", match.group(0))
        src = src_match.group(1) if src_match else ""
        findings.append(
            UnsupportedFinding(
                kind="in_article_image",
                line_start=_line_number(body, match.start()),
                line_end=_line_number(body, match.end()),
                excerpt=match.group(0)[:120],
                disposition=Disposition.MANUAL_REVIEW,
                recommendation=(
                    f"In-article image `{src}` is not migrated. "
                    "Use featured image or rewrite without inline images."
                ),
            )
        )

    # Inline backtick code — report once per line with backticks.
    for index, line in enumerate(body.splitlines(), start=1):
        if "`" in line and not line.strip().startswith("```"):
            findings.append(
                UnsupportedFinding(
                    kind="inline_code",
                    line_start=index,
                    line_end=index,
                    excerpt=line.strip()[:120],
                    disposition=Disposition.CONVERTED,
                    recommendation="Inline code is converted to plain text (backticks removed).",
                )
            )

    return findings


def findings_to_dict(findings: list[UnsupportedFinding]) -> list[dict[str, object]]:
    return [asdict(item) | {"disposition": item.disposition.value} for item in findings]
