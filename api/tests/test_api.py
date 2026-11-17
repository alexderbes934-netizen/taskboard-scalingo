from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_uses_database(test_db):
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_task_crud(test_db):
    client = TestClient(app)
    created = client.post("/api/tasks", json={"title": "Préparer le déploiement"})
    assert created.status_code == 201
    task = created.json()

    updated = client.patch(f"/api/tasks/{task['id']}", json={"completed": True})
    assert updated.status_code == 200
    assert updated.json()["completed"] is True

    assert client.get("/api/tasks").json()[0]["title"] == "Préparer le déploiement"
    assert client.delete(f"/api/tasks/{task['id']}").status_code == 204
    assert client.get("/api/tasks").json() == []
