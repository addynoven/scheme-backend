from unittest.mock import patch
from fastapi.testclient import TestClient


def test_health_check_readiness_probe(client: TestClient):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["version"] == "2.0.0"
    assert data["checks"]["database"] == "healthy"
    assert data["checks"]["storage"] == "healthy"


def test_health_check_returns_degraded_on_storage_failure(client: TestClient):
    from app.core.storage import storage_service

    with patch.object(storage_service, "ensure_bucket_exists", side_effect=RuntimeError("MinIO connection timeout")):
        res = client.get("/health")
        assert res.status_code == 503
        data = res.json()
        assert "storage" in data["detail"]["checks"]
        assert "unhealthy" in data["detail"]["checks"]["storage"]
