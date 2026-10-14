import pytest
from fastapi.testclient import TestClient

from app.main import _store, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear():
    _store.clear()


def payload(**over):
    return {"type": "expense", "amount": 100, "category": "food", "date": "2024-01-01", **over}


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_create_list_delete():
    r = client.post("/transactions", json=payload())
    assert r.status_code == 201
    tx_id = r.json()["id"]
    assert len(client.get("/transactions").json()) == 1
    assert client.delete(f"/transactions/{tx_id}").status_code == 204
    assert client.delete(f"/transactions/{tx_id}").status_code == 404


def test_validation():
    assert client.post("/transactions", json=payload(amount=0)).status_code == 422
    assert client.post("/transactions", json=payload(category=" ")).status_code == 422


def test_summary():
    client.post("/transactions", json=payload(type="income", amount=5000))
    client.post("/transactions", json=payload(amount=1200))
    assert client.get("/summary").json() == {"income": 5000, "expense": 1200, "balance": 3800}
