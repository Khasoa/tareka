import pytest

from app.modules.insights.document import (
    DocumentValidationError,
    document_has_visible_content,
    normalize_link_href,
    validate_document,
    validate_link_href,
)


def sample_document(**overrides: object) -> dict:
    doc = {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "Hello world"}],
            }
        ],
    }
    doc.update(overrides)
    return doc


def test_valid_document_is_accepted():
    document = validate_document(sample_document())
    assert document_has_visible_content(document)


def test_unknown_node_is_rejected():
    bad = sample_document()
    bad["content"] = [{"type": "image", "attrs": {"src": "https://example.org/x.jpg"}}]
    with pytest.raises(DocumentValidationError):
        validate_document(bad)


def test_unsupported_mark_is_rejected():
    bad = sample_document()
    bad["content"] = [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Hello",
                    "marks": [{"type": "underline"}],
                }
            ],
        }
    ]
    with pytest.raises(DocumentValidationError):
        validate_document(bad)


def test_unsafe_link_protocol_is_rejected():
    with pytest.raises(DocumentValidationError):
        validate_link_href("javascript:alert(1)")

    bad = sample_document()
    bad["content"] = [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Click",
                    "marks": [
                        {
                            "type": "link",
                            "attrs": {"href": "javascript:alert(1)"},
                        }
                    ],
                }
            ],
        }
    ]
    with pytest.raises(DocumentValidationError):
        validate_document(bad)


def test_mailto_link_is_accepted():
    assert validate_link_href("mailto:editor@example.org").startswith("mailto:")


def test_internal_relative_link_is_accepted():
    assert validate_link_href("/directory/nairobi") == "/directory/nairobi"
    assert validate_link_href("/insights/waste-hierarchy-kenya") == (
        "/insights/waste-hierarchy-kenya"
    )


def test_bare_domain_is_normalised_to_https():
    assert validate_link_href("example.com") == "https://example.com"
    assert validate_link_href("www.example.com/path") == "https://www.example.com/path"


def test_whitespace_href_is_trimmed():
    assert validate_link_href("  https://example.org/x  ") == "https://example.org/x"


def test_protocol_relative_url_is_rejected():
    assert normalize_link_href("//evil.example/phish") is None


def test_draft_save_strips_invalid_link_mark():
    doc = sample_document()
    doc["content"] = [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Keep me",
                    "marks": [
                        {"type": "link", "attrs": {"href": "javascript:alert(1)"}}
                    ],
                }
            ],
        }
    ]
    stripped: list[int] = []
    normalized = validate_document(doc, strip_invalid_links=True, stripped_out=stripped)
    assert stripped == [1]
    text_node = normalized["content"][0]["content"][0]
    assert text_node["text"] == "Keep me"
    assert "marks" not in text_node


def test_link_extra_attrs_are_stripped_on_validate():
    doc = sample_document()
    doc["content"] = [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Site",
                    "marks": [
                        {
                            "type": "link",
                            "attrs": {
                                "href": "https://example.org",
                                "target": "_blank",
                                "rel": "noopener noreferrer",
                                "class": None,
                            },
                        }
                    ],
                }
            ],
        }
    ]
    normalized = validate_document(doc)
    marks = normalized["content"][0]["content"][0]["marks"]
    assert marks == [{"type": "link", "attrs": {"href": "https://example.org"}}]


def test_link_unknown_attrs_are_rejected():
    bad = sample_document()
    bad["content"] = [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Site",
                    "marks": [
                        {
                            "type": "link",
                            "attrs": {
                                "href": "https://example.org",
                                "onclick": "alert(1)",
                            },
                        }
                    ],
                }
            ],
        }
    ]
    with pytest.raises(DocumentValidationError, match="Link mark attrs are invalid"):
        validate_document(bad)


def test_data_uri_href_is_rejected():
    with pytest.raises(DocumentValidationError):
        validate_link_href("data:text/html,hello")


def test_malformed_document_is_rejected():
    with pytest.raises(DocumentValidationError):
        validate_document({"type": "paragraph"})


def test_empty_draft_document_is_accepted():
    document = validate_document({"type": "doc", "content": []})
    assert document["content"] == []
    assert not document_has_visible_content(document)


def test_list_heading_and_blockquote_count_as_visible_content():
    list_doc = validate_document(
        {
            "type": "doc",
            "content": [
                {
                    "type": "bulletList",
                    "content": [
                        {
                            "type": "listItem",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [{"type": "text", "text": "Item"}],
                                }
                            ],
                        }
                    ],
                }
            ],
        }
    )
    heading_doc = validate_document(
        {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Heading"}],
                }
            ],
        }
    )
    quote_doc = validate_document(
        {
            "type": "doc",
            "content": [
                {
                    "type": "blockquote",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": "Quote"}],
                        }
                    ],
                }
            ],
        }
    )
    assert document_has_visible_content(list_doc)
    assert document_has_visible_content(heading_doc)
    assert document_has_visible_content(quote_doc)


def test_doc_without_content_key_normalizes_to_empty_list():
    document = validate_document({"type": "doc"})
    assert document["content"] == []


def test_oversized_document_is_rejected():
    huge = sample_document()
    huge["content"] = [
        {
            "type": "paragraph",
            "content": [{"type": "text", "text": "x" * 25000}],
        }
    ] * 30
    with pytest.raises(DocumentValidationError):
        validate_document(huge)
