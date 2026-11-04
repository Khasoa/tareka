from __future__ import annotations

import re
from dataclasses import dataclass

from app.modules.insights.document import (
    DocumentValidationError,
    validate_document,
    validate_link_href,
)

_LINK_PATTERN = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
_BOLD_PATTERN = re.compile(r"\*\*(.+?)\*\*")
_ITALIC_PATTERN = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|_(.+?)_")
_TABLE_DIVIDER = re.compile(r"^\s*\|?\s*:?-{3,}")


@dataclass(frozen=True)
class ConversionNote:
    kind: str
    message: str
    line: int | None = None


def _text_node(text: str, marks: list[dict] | None = None) -> dict:
    node: dict = {"type": "text", "text": text}
    if marks:
        node["marks"] = marks
    return node


def _apply_marks(nodes: list[dict], mark: dict) -> list[dict]:
    updated: list[dict] = []
    for node in nodes:
        if node.get("type") != "text":
            updated.append(node)
            continue
        marks = list(node.get("marks") or [])
        marks.append(mark)
        updated.append({**node, "marks": marks})
    return updated


def _paragraph_from_inlines(nodes: list[dict]) -> dict:
    return {"type": "paragraph", "content": nodes or [_text_node("")]}


def _manual_review_paragraph(label: str, detail: str) -> dict:
    return _paragraph_from_inlines(
        [_text_node(f"[Manual review required: {label}] {detail}")],
    )


def _parse_inline(text: str, notes: list[ConversionNote]) -> list[dict]:
    if not text:
        return [_text_node("")]

    if "`" in text:
        text = re.sub(r"`([^`]+)`", r"\1", text)
        notes.append(
            ConversionNote(
                kind="inline_code",
                message="Inline code converted to plain text.",
            )
        )

    nodes: list[dict] = []
    cursor = 0

    while cursor < len(text):
        candidates = [
            _LINK_PATTERN.search(text, cursor),
            _BOLD_PATTERN.search(text, cursor),
            _ITALIC_PATTERN.search(text, cursor),
        ]
        matches = [match for match in candidates if match is not None]
        if not matches:
            nodes.append(_text_node(text[cursor:]))
            break

        match = min(matches, key=lambda item: item.start())
        if match.start() > cursor:
            nodes.append(_text_node(text[cursor : match.start()]))

        if match.re is _LINK_PATTERN:
            label = match.group(1)
            href_raw = match.group(2).strip()
            try:
                href = validate_link_href(href_raw)
            except DocumentValidationError:
                notes.append(
                    ConversionNote(
                        kind="unsafe_link",
                        message=f"Unsafe link omitted: {href_raw}",
                    )
                )
                nodes.extend(_parse_inline(label, notes))
            else:
                linked = _apply_marks(
                    _parse_inline(label, notes),
                    {"type": "link", "attrs": {"href": href}},
                )
                nodes.extend(linked)
        elif match.re is _BOLD_PATTERN:
            nodes.extend(
                _apply_marks(_parse_inline(match.group(1), notes), {"type": "bold"}),
            )
        else:
            inner = match.group(1) or match.group(2) or ""
            nodes.extend(
                _apply_marks(_parse_inline(inner, notes), {"type": "italic"}),
            )

        cursor = match.end()

    return nodes or [_text_node("")]


def _heading_level(line: str) -> tuple[int, str] | None:
    if line.startswith("### "):
        return 3, line[4:].strip()
    if line.startswith("## "):
        return 2, line[3:].strip()
    if line.startswith("# "):
        return 2, line[2:].strip()
    return None


def _is_ordered_item(line: str) -> bool:
    return bool(re.match(r"^\d+\.\s+", line.strip()))


def _is_bullet_item(line: str) -> bool:
    return bool(re.match(r"^[-*+]\s+", line.strip()))


def _strip_list_prefix(line: str) -> str:
    return re.sub(r"^(\d+\.|[-*+])\s+", "", line.strip())


def markdown_body_to_document(body: str) -> tuple[dict, list[ConversionNote]]:
    notes: list[ConversionNote] = []
    content: list[dict] = []

    lines = body.replace("\r\n", "\n").splitlines()
    index = 0
    while index < len(lines):
        line = lines[index]
        stripped = line.strip()

        if not stripped:
            index += 1
            continue

        if stripped.startswith("```"):
            end = index + 1
            while end < len(lines) and not lines[end].strip().startswith("```"):
                end += 1
            snippet = " ".join(lines[index : min(end + 1, len(lines))])[:160]
            content.append(_manual_review_paragraph("code block", snippet))
            notes.append(
                ConversionNote(
                    kind="code_block",
                    message="Code block preserved as manual-review marker paragraph.",
                    line=index + 1,
                )
            )
            index = end + 1 if end < len(lines) else len(lines)
            continue

        if _TABLE_DIVIDER.match(stripped):
            content.append(_manual_review_paragraph("table", stripped))
            notes.append(
                ConversionNote(
                    kind="table",
                    message="Table preserved as manual-review marker paragraph.",
                    line=index + 1,
                )
            )
            index += 1
            continue

        heading = _heading_level(stripped)
        if heading:
            level, text = heading
            if stripped.startswith("# ") and not stripped.startswith("## "):
                notes.append(
                    ConversionNote(
                        kind="heading",
                        message="H1 mapped to H2.",
                        line=index + 1,
                    )
                )
            content.append(
                {
                    "type": "heading",
                    "attrs": {"level": level},
                    "content": _parse_inline(text, notes),
                }
            )
            index += 1
            continue

        if stripped.startswith(">"):
            quote_lines: list[str] = []
            while index < len(lines) and lines[index].strip().startswith(">"):
                quote_lines.append(lines[index].strip().lstrip(">").strip())
                index += 1
            quote_text = " ".join(quote_lines)
            content.append(
                {
                    "type": "blockquote",
                    "content": [
                        _paragraph_from_inlines(_parse_inline(quote_text, notes))
                    ],
                }
            )
            continue

        if _is_ordered_item(stripped):
            items: list[dict] = []
            while index < len(lines) and _is_ordered_item(lines[index]):
                items.append(
                    {
                        "type": "listItem",
                        "content": [
                            _paragraph_from_inlines(
                                _parse_inline(_strip_list_prefix(lines[index]), notes),
                            )
                        ],
                    }
                )
                index += 1
            content.append({"type": "orderedList", "content": items})
            continue

        if _is_bullet_item(stripped):
            items = []
            while index < len(lines) and _is_bullet_item(lines[index]):
                items.append(
                    {
                        "type": "listItem",
                        "content": [
                            _paragraph_from_inlines(
                                _parse_inline(_strip_list_prefix(lines[index]), notes),
                            )
                        ],
                    }
                )
                index += 1
            content.append({"type": "bulletList", "content": items})
            continue

        paragraph_lines = [stripped]
        index += 1
        while index < len(lines) and lines[index].strip():
            next_line = lines[index].strip()
            if (
                _heading_level(next_line)
                or next_line.startswith((">", "```"))
                or _is_ordered_item(next_line)
                or _is_bullet_item(next_line)
            ):
                break
            paragraph_lines.append(next_line)
            index += 1

        paragraph_text = " ".join(paragraph_lines)
        content.append(_paragraph_from_inlines(_parse_inline(paragraph_text, notes)))

    document = {"type": "doc", "content": content or [{"type": "paragraph"}]}
    validated = validate_document(document)
    return validated, notes
