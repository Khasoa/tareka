"""Validate Tiptap-compatible JSON documents for Insights articles."""

from __future__ import annotations

import json
import logging
import re
from typing import Any
from urllib.parse import urlsplit

logger = logging.getLogger(__name__)

UNSAFE_LINK_SCHEME = re.compile(r"^(javascript|data|vbscript|file):", re.IGNORECASE)

ALLOWED_NODE_TYPES = frozenset(
    {
        "doc",
        "paragraph",
        "heading",
        "bulletList",
        "orderedList",
        "listItem",
        "blockquote",
        "text",
        "hardBreak",
    }
)
ALLOWED_MARK_TYPES = frozenset({"bold", "italic", "link"})
ALLOWED_HEADING_LEVELS = frozenset({2, 3})
HARMLESS_LINK_ATTR_KEYS = frozenset({"target", "rel", "class", "title"})
LINK_STRIPPED_NOTICE = "One link was removed because its address wasn't valid."

MAX_DOCUMENT_BYTES = 512_000
MAX_NODE_COUNT = 2_000
MAX_DEPTH = 24
MAX_TEXT_NODE_LENGTH = 20_000

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class DocumentValidationError(ValueError):
    pass


def validate_article_slug(slug: str) -> str:
    value = slug.strip().lower()
    if not SLUG_PATTERN.fullmatch(value):
        raise ValueError(
            "Slug must use lowercase letters, numbers and hyphens only.",
        )
    return value


def normalize_link_href(href: str) -> str | None:
    """Return a normalised href suitable for storage, or None if unsafe/invalid."""
    if not isinstance(href, str):
        return None

    value = href.strip()
    if not value:
        return None

    lowered = value.lower()
    if UNSAFE_LINK_SCHEME.match(lowered):
        return None
    if value.startswith("//"):
        return None

    if lowered.startswith("mailto:"):
        address = value[len("mailto:") :].split("?", 1)[0].strip()
        if not address or "@" not in address:
            return None
        if any(char.isspace() for char in value):
            return None
        return value

    if value.startswith("/"):
        if any(char.isspace() for char in value):
            return None
        return value

    candidate = value
    if not re.match(r"^[a-z][a-z0-9+.-]*:", candidate, re.IGNORECASE):
        candidate = f"https://{candidate.lstrip('/')}"

    try:
        parsed = urlsplit(candidate)
    except ValueError:
        return None

    if parsed.scheme.lower() not in {"http", "https"}:
        return None
    if not parsed.netloc or not parsed.hostname:
        return None
    if parsed.username is not None or parsed.password is not None:
        return None
    if any(char.isspace() for char in candidate):
        return None

    return candidate


def validate_link_href(href: str) -> str:
    normalized = normalize_link_href(href)
    if normalized is None:
        raise DocumentValidationError("Enter a valid link URL.")
    return normalized


def _log_link_rejection(href: Any, attr_keys: list[str], reason: str) -> None:
    href_repr = repr(href)[:160] if href is not None else "null"
    logger.info(
        "insights_link_rejected href=%s attr_keys=%s reason=%s",
        href_repr,
        attr_keys,
        reason,
    )


def _clean_link_mark(mark: dict[str, Any]) -> dict[str, Any]:
    mark_attrs = mark.get("attrs")
    if not isinstance(mark_attrs, dict):
        raise DocumentValidationError("Link mark requires attrs.")

    attr_keys = sorted(mark_attrs.keys())
    href_raw = mark_attrs.get("href")
    if not isinstance(href_raw, str):
        raise DocumentValidationError("Link href must be a string.")

    normalized = normalize_link_href(href_raw)
    if normalized is None:
        raise DocumentValidationError("Enter a valid link URL.")

    extra = set(attr_keys) - HARMLESS_LINK_ATTR_KEYS - {"href"}
    if extra:
        raise DocumentValidationError("Link mark attrs are invalid.")

    return {"type": "link", "attrs": {"href": normalized}}


def _normalize_link_mark_attrs(mark: dict[str, Any]) -> None:
    cleaned = _clean_link_mark(mark)
    mark.clear()
    mark.update(cleaned)


def validate_document(
    document: Any,
    *,
    strip_invalid_links: bool = False,
    stripped_out: list[int] | None = None,
) -> dict[str, Any]:
    if not isinstance(document, dict):
        raise DocumentValidationError("Document must be a JSON object.")

    encoded = json.dumps(document, separators=(",", ":"), ensure_ascii=False)
    if len(encoded.encode("utf-8")) > MAX_DOCUMENT_BYTES:
        raise DocumentValidationError("Document is too large.")

    node_count = 0
    stripped_links = 0

    def walk(node: Any, depth: int) -> None:
        nonlocal node_count, stripped_links
        if depth > MAX_DEPTH:
            raise DocumentValidationError("Document nesting is too deep.")

        if not isinstance(node, dict):
            raise DocumentValidationError("Document nodes must be objects.")

        node_type = node.get("type")
        if not isinstance(node_type, str) or node_type not in ALLOWED_NODE_TYPES:
            raise DocumentValidationError(f"Unsupported node type: {node_type!r}.")

        node_count += 1
        if node_count > MAX_NODE_COUNT:
            raise DocumentValidationError("Document contains too many nodes.")

        allowed_keys = {"type", "content", "text", "marks", "attrs"}
        extra_keys = set(node.keys()) - allowed_keys
        if extra_keys:
            raise DocumentValidationError("Document node contains unknown fields.")

        attrs = node.get("attrs")
        if attrs is not None:
            if not isinstance(attrs, dict):
                raise DocumentValidationError("Node attrs must be an object.")
            if node_type == "heading":
                level = attrs.get("level")
                if level not in ALLOWED_HEADING_LEVELS:
                    raise DocumentValidationError("Heading level must be 2 or 3.")
                if set(attrs.keys()) != {"level"}:
                    raise DocumentValidationError("Heading attrs are not allowed.")
            elif attrs:
                raise DocumentValidationError("Attrs are not allowed on this node.")

        marks = node.get("marks")
        if marks is not None:
            if node_type != "text":
                raise DocumentValidationError("Marks are only allowed on text nodes.")
            if not isinstance(marks, list):
                raise DocumentValidationError("Marks must be a list.")
            cleaned_marks: list[dict[str, Any]] = []
            for mark in marks:
                if not isinstance(mark, dict):
                    raise DocumentValidationError("Mark must be an object.")
                mark_type = mark.get("type")
                if mark_type not in ALLOWED_MARK_TYPES:
                    raise DocumentValidationError(
                        f"Unsupported mark type: {mark_type!r}."
                    )
                if set(mark.keys()) - {"type", "attrs"}:
                    raise DocumentValidationError("Mark contains unknown fields.")
                if mark_type == "link":
                    attr_keys = (
                        sorted(mark.get("attrs", {}).keys())
                        if isinstance(mark.get("attrs"), dict)
                        else []
                    )
                    href_raw = (
                        mark.get("attrs", {}).get("href")
                        if isinstance(mark.get("attrs"), dict)
                        else None
                    )
                    try:
                        cleaned_marks.append(_clean_link_mark(mark))
                    except DocumentValidationError as exc:
                        if strip_invalid_links:
                            stripped_links += 1
                            _log_link_rejection(href_raw, attr_keys, str(exc))
                            continue
                        raise
                elif mark.get("attrs"):
                    raise DocumentValidationError("Mark attrs are not allowed.")
                else:
                    cleaned_marks.append(mark)
            if cleaned_marks:
                node["marks"] = cleaned_marks
            elif "marks" in node:
                del node["marks"]

        text = node.get("text")
        if text is not None:
            if node_type != "text":
                raise DocumentValidationError("Text is only allowed on text nodes.")
            if not isinstance(text, str):
                raise DocumentValidationError("Text node content must be a string.")
            if len(text) > MAX_TEXT_NODE_LENGTH:
                raise DocumentValidationError("Text node is too long.")

        content = node.get("content")
        if content is not None:
            if node_type in {"text", "hardBreak"}:
                raise DocumentValidationError("Leaf nodes cannot contain content.")
            if not isinstance(content, list):
                raise DocumentValidationError("Node content must be a list.")
            for child in content:
                walk(child, depth + 1)

    if document.get("type") != "doc":
        raise DocumentValidationError("Document root must have type 'doc'.")

    normalized = dict(document)
    if normalized.get("content") is None:
        normalized["content"] = []

    walk(normalized, depth=0)
    if stripped_out is not None:
        stripped_out[:] = [stripped_links]
    return normalized


def document_has_visible_content(document: dict[str, Any]) -> bool:
    """Return True when the document contains non-whitespace text."""

    def has_text(node: Any) -> bool:
        if not isinstance(node, dict):
            return False
        text = node.get("text")
        if isinstance(text, str) and text.strip():
            return True
        content = node.get("content")
        if isinstance(content, list):
            return any(has_text(child) for child in content)
        return False

    return has_text(document)


def empty_document() -> dict[str, Any]:
    return {"type": "doc", "content": []}


def normalize_document(value: Any) -> dict[str, Any]:
    """Coerce stored JSON into a valid document or an empty doc."""
    if not isinstance(value, dict) or value.get("type") != "doc":
        return empty_document()
    try:
        return validate_document(value)
    except DocumentValidationError:
        content = value.get("content")
        if isinstance(content, list):
            try:
                return validate_document({"type": "doc", "content": content})
            except DocumentValidationError:
                pass
        return empty_document()
