from __future__ import annotations

from app.modules.insights.mdx_import.analyze import analyze_mdx_body
from app.modules.insights.mdx_import.frontmatter import parse_mdx_file
from app.modules.insights.mdx_import.markdown_to_document import (
    markdown_body_to_document,
)
from app.modules.insights.mdx_import.paths import DEFAULT_CONTENT_DIR


def test_all_source_mdx_files_are_discovered():
    files = sorted(DEFAULT_CONTENT_DIR.glob("*.mdx"))
    assert len(files) == 2
    names = {path.name for path in files}
    assert names == {"its-not-just-about-waste.mdx", "waste-hierarchy-kenya.mdx"}


def test_frontmatter_parsed_for_waste_hierarchy():
    path = DEFAULT_CONTENT_DIR / "waste-hierarchy-kenya.mdx"
    parsed = parse_mdx_file(path)
    assert parsed.frontmatter["slug"] == "waste-hierarchy-kenya"
    assert parsed.frontmatter["category"] == "Foundations"
    assert (
        parsed.frontmatter["seo_title"] == "The Waste Hierarchy in Kenya: What It Means"
    )
    assert str(parsed.frontmatter["published_at"]) == "2026-10-23"


def test_markdown_conversion_preserves_links_and_lists():
    body = (
        "Intro paragraph with [link](https://example.com/path).\n\n"
        "### Subheading\n\n"
        "1. First item\n"
        "2. Second item\n\n"
        "> A quoted line\n"
    )
    document, _notes = markdown_body_to_document(body)
    assert document["type"] == "doc"
    types = [node["type"] for node in document["content"]]
    assert "paragraph" in types
    assert "heading" in types
    assert "orderedList" in types
    assert "blockquote" in types

    def collect_link_hrefs(node: object) -> list[str]:
        hrefs: list[str] = []
        if isinstance(node, dict):
            if node.get("type") == "text":
                for mark in node.get("marks") or []:
                    if mark.get("type") == "link":
                        hrefs.append(mark["attrs"]["href"])
            for child in node.get("content") or []:
                hrefs.extend(collect_link_hrefs(child))
        return hrefs

    assert "https://example.com/path" in collect_link_hrefs(document)


def test_h1_maps_to_h2_with_note():
    body = "# Top level\n\nParagraph"
    document, notes = markdown_body_to_document(body)
    heading = next(node for node in document["content"] if node["type"] == "heading")
    assert heading["attrs"]["level"] == 2
    assert any(note.kind == "heading" for note in notes)


def test_plain_asterisk_text_is_not_treated_as_markdown_structure():
    body = "Price is $5 * 3 units"
    findings = analyze_mdx_body(body)
    assert not any(item.kind == "mdx_expression" for item in findings)


def test_code_block_reported_and_marked_for_manual_review():
    body = "Before\n\n```python\nprint('x')\n```\n\nAfter"
    findings = analyze_mdx_body(body)
    assert any(item.kind == "code_block" for item in findings)
    document, _notes = markdown_body_to_document(body)
    marker = document["content"][1]["content"][0]["text"]
    assert "Manual review required: code block" in marker
