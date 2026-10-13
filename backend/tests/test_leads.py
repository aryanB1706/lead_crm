"""API tests against isolated postgres (leadflow_test)."""
from sqlalchemy import func, select

from app.models import Discussion, Lead


def test_create_lead_201(client):
    r = client.post("/api/leads", json={"name": "Aarti", "company": "Acme"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["name"] == "Aarti"
    assert body["status"] == "New"
    assert body["created_at"].endswith("Z")


def test_create_lead_missing_name_422(client):
    r = client.post("/api/leads", json={"company": "Acme"})
    assert r.status_code == 422
    assert "detail" in r.json()


def test_create_lead_blank_name_422(client):
    r = client.post("/api/leads", json={"name": "   "})
    assert r.status_code == 422
    assert "detail" in r.json()


def test_default_status_new(client):
    r = client.post("/api/leads", json={"name": "Rohan"})
    assert r.status_code == 201
    assert r.json()["status"] == "New"


def test_list_status_filter(client):
    client.post("/api/leads", json={"name": "L1"})
    l2 = client.post("/api/leads", json={"name": "L2"}).json()
    client.patch(f"/api/leads/{l2['id']}", json={"status": "Contacted"})
    r = client.get("/api/leads", params={"status": "Contacted"})
    assert r.status_code == 200
    assert all(x["status"] == "Contacted" for x in r.json())
    assert any(x["id"] == l2["id"] for x in r.json())


def test_list_invalid_status_422(client):
    r = client.get("/api/leads", params={"status": "Bogus"})
    assert r.status_code == 422
    assert "detail" in r.json()


def test_list_name_search_case_insensitive(client):
    client.post("/api/leads", json={"name": "Aarti Sharma"})
    client.post("/api/leads", json={"name": "Rohan Mehta"})
    r = client.get("/api/leads", params={"search": "aarti"})
    assert r.status_code == 200
    names = [x["name"] for x in r.json()]
    assert "Aarti Sharma" in names
    assert "Rohan Mehta" not in names


def test_search_with_percent_underscore_escaped(client):
    client.post("/api/leads", json={"name": "Rohan 100%_test"})
    client.post("/api/leads", json={"name": "Rohan 100Xtest"})
    r = client.get("/api/leads", params={"search": "100%_test"})
    assert r.status_code == 200
    names = [x["name"] for x in r.json()]
    # % and _ must be literal, not wildcards.
    assert "Rohan 100%_test" in names
    assert "Rohan 100Xtest" not in names


def test_get_missing_lead_404(client):
    r = client.get("/api/leads/99999")
    assert r.status_code == 404
    assert r.json() == {"detail": "lead not found"}


def test_patch_status_persists(client):
    lead = client.post("/api/leads", json={"name": "Priya"}).json()
    r = client.patch(f"/api/leads/{lead['id']}", json={"status": "Qualified"})
    assert r.status_code == 200
    assert r.json()["status"] == "Qualified"
    # persists on re-fetch
    r2 = client.get(f"/api/leads/{lead['id']}")
    assert r2.json()["status"] == "Qualified"


def test_patch_follow_up_clear(client):
    lead = client.post("/api/leads", json={"name": "Kabir"}).json()
    client.post(
        f"/api/leads/{lead['id']}/discussions",
        json={"note": "call", "follow_up_at": "2026-10-20T10:00:00Z"},
    )
    r = client.patch(f"/api/leads/{lead['id']}", json={"follow_up_at": None})
    assert r.status_code == 200
    assert r.json()["follow_up_at"] is None


def test_add_discussion_updates_follow_up(client):
    lead = client.post("/api/leads", json={"name": "Neha"}).json()
    fu = "2026-10-20T10:00:00Z"
    r = client.post(
        f"/api/leads/{lead['id']}/discussions",
        json={"note": "interested", "follow_up_at": fu},
    )
    assert r.status_code == 201, r.text
    got = client.get(f"/api/leads/{lead['id']}").json()
    assert got["follow_up_at"] == fu
    assert got["last_note"] == "interested"
    assert got["last_discussion_at"] is not None


def test_add_discussion_missing_lead_404(client):
    r = client.post("/api/leads/99999/discussions", json={"note": "hi"})
    assert r.status_code == 404
    assert "detail" in r.json()


def test_add_discussion_empty_note_422(client):
    lead = client.post("/api/leads", json={"name": "Arjun"}).json()
    r = client.post(f"/api/leads/{lead['id']}/discussions", json={"note": "   "})
    assert r.status_code == 422
    assert "detail" in r.json()


def test_discussions_newest_first(client):
    lead = client.post("/api/leads", json={"name": "Ishaan"}).json()
    client.post(f"/api/leads/{lead['id']}/discussions", json={"note": "first"})
    client.post(f"/api/leads/{lead['id']}/discussions", json={"note": "second"})
    r = client.get(f"/api/leads/{lead['id']}/discussions")
    assert r.status_code == 200
    notes = [d["note"] for d in r.json()]
    assert notes == ["second", "first"]


def test_delete_lead_cascades_discussions(client, db_session):
    lead = client.post("/api/leads", json={"name": "Cascade"}).json()
    client.post(f"/api/leads/{lead['id']}/discussions", json={"note": "n1"})
    client.post(f"/api/leads/{lead['id']}/discussions", json={"note": "n2"})
    # Direct DB delete (no DELETE endpoint in Step 2 spec).
    obj = db_session.get(Lead, lead["id"])
    db_session.delete(obj)
    db_session.commit()
    remaining = db_session.execute(
        select(func.count()).select_from(Discussion).where(Discussion.lead_id == lead["id"])
    ).scalar()
    assert remaining == 0
