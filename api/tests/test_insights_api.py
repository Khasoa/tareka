from datetime import date

import pytest
from sqlalchemy import func, select

from app.modules.admin.models import AdminUser
from app.modules.admin.security import hash_password
from app.modules.insights.document import document_has_visible_content
from app.modules.insights.models import InsightArticle, InsightCategory
from tests.test_insights_document import sample_document


@pytest.fixture
def insight_categories(db_session):
    categories = [
        InsightCategory(slug="foundations", name="Foundations", sort_order=1),
        InsightCategory(
            slug="recovery-in-practice",
            name="Recovery in Practice",
            sort_order=2,
        ),
    ]
    db_session.add_all(categories)
    db_session.commit()
    return categories


def login_admin(
    client, db_session, email="admin@example.org", password="test-password-123"
):
    db_session.add(AdminUser(email=email, password_hash=hash_password(password)))
    db_session.commit()
    response = client.post(
        "/api/admin/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response


def test_public_list_excludes_drafts(client, db_session, insight_categories):
    db_session.add(
        InsightArticle(
            slug="draft-only",
            title="Draft",
            excerpt="Hidden",
            category_id=insight_categories[0].id,
            body_json=sample_document(),
            status="draft",
            version=1,
        )
    )
    db_session.add(
        InsightArticle(
            slug="published-one",
            title="Published",
            excerpt="Visible",
            category_id=insight_categories[0].id,
            body_json=sample_document(),
            status="published",
            published_at=date(2026, 10, 1),
            version=1,
        )
    )
    db_session.commit()

    response = client.get("/api/insights")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["slug"] == "published-one"


def test_admin_mutations_require_authentication(client):
    response = client.post("/api/admin/insights", json={"title": "Draft"})
    assert response.status_code == 401


def test_create_update_publish_and_unpublish_flow(
    client,
    db_session,
    insight_categories,
):
    login_admin(client, db_session)

    create_response = client.post(
        "/api/admin/insights",
        json={
            "slug": "editorial-flow",
            "title": "Draft title",
            "category_id": insight_categories[0].id,
        },
    )
    assert create_response.status_code == 201
    article = create_response.json()
    assert article["status"] == "draft"
    assert article["version"] == 1

    update_response = client.patch(
        f"/api/admin/insights/{article['id']}",
        json={
            "version": 1,
            "excerpt": "Summary",
            "body_json": sample_document(),
            "published_at": "2026-10-15",
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["version"] == 2

    publish_response = client.post(
        f"/api/admin/insights/{updated['id']}/publish",
        json={"version": 2},
    )
    assert publish_response.status_code == 200
    published = publish_response.json()
    assert published["status"] == "published"

    public_response = client.get("/api/insights/editorial-flow")
    assert public_response.status_code == 200

    unpublish_response = client.post(
        f"/api/admin/insights/{published['id']}/unpublish",
        json={"version": published["version"]},
    )
    assert unpublish_response.status_code == 200
    assert client.get("/api/insights/editorial-flow").status_code == 404


def test_unique_slug_enforced(client, db_session, insight_categories):
    login_admin(client, db_session)
    first = client.post(
        "/api/admin/insights",
        json={
            "slug": "duplicate-slug",
            "title": "One",
            "category_id": insight_categories[0].id,
        },
    )
    assert first.status_code == 201
    second = client.post(
        "/api/admin/insights",
        json={
            "slug": "duplicate-slug",
            "title": "Two",
            "category_id": insight_categories[0].id,
        },
    )
    assert second.status_code == 409


def test_publish_requires_complete_content(client, db_session, insight_categories):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "incomplete",
            "title": "",
            "category_id": insight_categories[0].id,
        },
    ).json()

    response = client.post(
        f"/api/admin/insights/{created['id']}/publish",
        json={"version": created["version"]},
    )
    assert response.status_code == 422


def test_seo_title_suffix_is_stripped_on_save(client, db_session, insight_categories):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "seo-strip",
            "title": "Title",
            "category_id": insight_categories[0].id,
        },
    ).json()
    response = client.patch(
        f"/api/admin/insights/{created['id']}",
        json={
            "version": created["version"],
            "seo_title": "Custom headline | tareka",
        },
    )
    assert response.status_code == 200
    assert response.json()["seo_title"] == "Custom headline"


def test_published_slug_cannot_change(client, db_session, insight_categories):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "locked-slug",
            "title": "Title",
            "category_id": insight_categories[0].id,
        },
    ).json()
    client.patch(
        f"/api/admin/insights/{created['id']}",
        json={
            "version": created["version"],
            "excerpt": "Summary",
            "body_json": sample_document(),
            "published_at": "2026-10-15",
        },
    )
    published = client.post(
        f"/api/admin/insights/{created['id']}/publish",
        json={"version": 2},
    ).json()

    response = client.patch(
        f"/api/admin/insights/{published['id']}",
        json={"version": published["version"], "slug": "new-slug"},
    )
    assert response.status_code == 409


def test_draft_delete(client, db_session, insight_categories):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "delete-me",
            "title": "Delete",
            "category_id": insight_categories[0].id,
        },
    ).json()
    response = client.delete(f"/api/admin/insights/{created['id']}")
    assert response.status_code == 204
    assert response.content in (b"", None)
    assert db_session.scalar(select(func.count()).select_from(InsightArticle)) == 0


def test_empty_body_draft_save_is_accepted(client, db_session, insight_categories):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "empty-body",
            "title": "Draft",
            "category_id": insight_categories[0].id,
        },
    ).json()

    response = client.patch(
        f"/api/admin/insights/{created['id']}",
        json={
            "version": created["version"],
            "body_json": {"type": "doc", "content": []},
        },
    )
    assert response.status_code == 200
    assert response.json()["body_json"]["content"] == []


def test_publish_rejects_empty_body(client, db_session, insight_categories):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "empty-publish",
            "title": "Title",
            "category_id": insight_categories[0].id,
        },
    ).json()
    client.patch(
        f"/api/admin/insights/{created['id']}",
        json={
            "version": created["version"],
            "excerpt": "Summary",
            "body_json": {"type": "doc", "content": []},
            "published_at": "2026-10-15",
        },
    )
    response = client.post(
        f"/api/admin/insights/{created['id']}/publish",
        json={"version": 2},
    )
    assert response.status_code == 422


def test_save_document_with_extra_link_attrs(client, db_session, insight_categories):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "link-attrs",
            "title": "Title",
            "category_id": insight_categories[0].id,
        },
    ).json()
    body = sample_document()
    body["content"] = [
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
                                "href": "https://example.org/page",
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
    response = client.patch(
        f"/api/admin/insights/{created['id']}",
        json={"version": created["version"], "body_json": body},
    )
    assert response.status_code == 200
    marks = response.json()["body_json"]["content"][0]["content"][0]["marks"]
    assert marks == [{"type": "link", "attrs": {"href": "https://example.org/page"}}]


def test_save_internal_and_bare_domain_links(client, db_session, insight_categories):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "link-normalize",
            "title": "Title",
            "category_id": insight_categories[0].id,
        },
    ).json()
    body = sample_document()
    body["content"] = [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Dir",
                    "marks": [
                        {"type": "link", "attrs": {"href": "/directory/nairobi"}}
                    ],
                },
                {"type": "text", "text": " "},
                {
                    "type": "text",
                    "text": "Ext",
                    "marks": [{"type": "link", "attrs": {"href": "example.com"}}],
                },
            ],
        }
    ]
    response = client.patch(
        f"/api/admin/insights/{created['id']}",
        json={"version": created["version"], "body_json": body},
    )
    assert response.status_code == 200
    marks = response.json()["body_json"]["content"][0]["content"]
    assert marks[0]["marks"] == [
        {"type": "link", "attrs": {"href": "/directory/nairobi"}}
    ]
    assert marks[2]["marks"] == [
        {"type": "link", "attrs": {"href": "https://example.com"}}
    ]


def test_draft_save_strips_invalid_link_and_returns_notice(
    client,
    db_session,
    insight_categories,
):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "link-strip",
            "title": "Title",
            "category_id": insight_categories[0].id,
        },
    ).json()
    body = sample_document()
    body["content"] = [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Text",
                    "marks": [
                        {"type": "link", "attrs": {"href": "javascript:alert(1)"}}
                    ],
                }
            ],
        }
    ]
    response = client.patch(
        f"/api/admin/insights/{created['id']}",
        json={"version": created["version"], "body_json": body},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["save_notices"]
    assert "removed" in payload["save_notices"][0].lower()
    text_node = payload["body_json"]["content"][0]["content"][0]
    assert text_node["text"] == "Text"
    assert "marks" not in text_node


def test_stale_version_conflict(client, db_session, insight_categories):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "conflict",
            "title": "Conflict",
            "category_id": insight_categories[0].id,
        },
    ).json()
    stale = client.patch(
        f"/api/admin/insights/{created['id']}",
        json={"version": 999, "title": "Too late"},
    )
    assert stale.status_code == 409
    assert stale.json()["detail"]["current_version"] == created["version"]


def test_cannot_replace_nonempty_body_with_empty_without_flag(
    client,
    db_session,
    insight_categories,
):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "body-guard",
            "title": "Title",
            "category_id": insight_categories[0].id,
        },
    ).json()
    with_body = client.patch(
        f"/api/admin/insights/{created['id']}",
        json={
            "version": created["version"],
            "body_json": sample_document(),
        },
    )
    assert with_body.status_code == 200
    version = with_body.json()["version"]

    blocked = client.patch(
        f"/api/admin/insights/{with_body.json()['id']}",
        json={
            "version": version,
            "body_json": {"type": "doc", "content": []},
        },
    )
    assert blocked.status_code == 422
    assert "empty" in blocked.json()["detail"].lower()

    article = client.get(f"/api/admin/insights/{created['id']}").json()
    assert document_has_visible_content(article["body_json"])


def test_allow_empty_body_flag_clears_nonempty_body(
    client,
    db_session,
    insight_categories,
):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={
            "slug": "body-clear",
            "title": "Title",
            "category_id": insight_categories[0].id,
        },
    ).json()
    with_body = client.patch(
        f"/api/admin/insights/{created['id']}",
        json={
            "version": created["version"],
            "body_json": sample_document(),
        },
    )
    version = with_body.json()["version"]

    cleared = client.patch(
        f"/api/admin/insights/{created['id']}",
        json={
            "version": version,
            "body_json": {"type": "doc", "content": []},
            "allow_empty_body": True,
        },
    )
    assert cleared.status_code == 200
    assert not document_has_visible_content(cleared.json()["body_json"])


ADMIN_INSIGHTS_ROUTES = [
    ("GET", "/api/admin/insights/categories"),
    ("GET", "/api/admin/insights"),
    ("POST", "/api/admin/insights"),
    ("GET", "/api/admin/insights/1"),
    ("PATCH", "/api/admin/insights/1"),
    ("POST", "/api/admin/insights/1/publish"),
    ("POST", "/api/admin/insights/1/unpublish"),
    ("DELETE", "/api/admin/insights/1"),
    ("POST", "/api/admin/insights/featured-image/upload"),
]


@pytest.mark.parametrize("method,path", ADMIN_INSIGHTS_ROUTES)
def test_admin_insights_endpoints_require_authentication(client, method, path):
    kwargs: dict = {}
    if method == "POST" and path == "/api/admin/insights":
        kwargs["json"] = {"title": "Draft"}
    elif method == "PATCH":
        kwargs["json"] = {"version": 1, "title": "Updated"}
    elif method == "POST" and path.endswith(("/publish", "/unpublish")):
        kwargs["json"] = {"version": 1}
    elif method == "POST" and "featured-image" in path:
        kwargs["files"] = {"file": ("photo.jpg", b"not-an-image", "image/jpeg")}

    response = client.request(method, path, **kwargs)
    assert response.status_code == 401


def test_admin_insights_mutations_reject_untrusted_origin(
    client,
    db_session,
    insight_categories,
):
    login_admin(client, db_session)
    created = client.post(
        "/api/admin/insights",
        json={"title": "Origin guard"},
    ).json()
    article_id = created["id"]
    version = created["version"]
    evil_origin = {"Origin": "https://evil.example"}

    cases = [
        ("POST", "/api/admin/insights", {"json": {"title": "Another draft"}}),
        (
            "PATCH",
            f"/api/admin/insights/{article_id}",
            {"json": {"version": version, "title": "Changed title"}},
        ),
        (
            "POST",
            f"/api/admin/insights/{article_id}/publish",
            {"json": {"version": version}},
        ),
        (
            "POST",
            f"/api/admin/insights/{article_id}/unpublish",
            {"json": {"version": version + 1}},
        ),
        ("DELETE", f"/api/admin/insights/{article_id}", {}),
        (
            "POST",
            "/api/admin/insights/featured-image/upload",
            {"files": {"file": ("photo.jpg", b"x", "image/jpeg")}},
        ),
    ]

    for method, path, extra in cases:
        response = client.request(
            method,
            path,
            headers=evil_origin,
            **extra,
        )
        assert response.status_code == 403, (method, path, response.json())


def test_admin_insights_mutations_reject_missing_origin(client, db_session):
    login_admin(client, db_session)
    response = client.post(
        "/api/admin/insights",
        json={"title": "Missing origin"},
        headers={"Origin": ""},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Origin header required"
