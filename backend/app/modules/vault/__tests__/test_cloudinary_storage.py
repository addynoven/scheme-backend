import base64
import pytest
from app.core.config import settings
from app.core.storage import CloudinaryStorageService, storage_service


def test_cloudinary_storage_service_lifecycle():
    service = CloudinaryStorageService()

    # 1. Test ensure_bucket_exists (no-op)
    service.ensure_bucket_exists()

    # 2. Test uploading 1x1 PNG bytes
    png_bytes = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
    object_key = "vault_test/integration_test_card.png"

    uploaded_key = service.upload_bytes(
        file_bytes=png_bytes,
        object_key=object_key,
        content_type="image/png",
    )
    assert uploaded_key == object_key

    # 3. Test generate_presigned_download_url
    url = service.generate_presigned_download_url(object_key)
    assert "res.cloudinary.com" in url
    assert "vault_test/integration_test_card" in url

    # 4. Test get_object
    retrieved_bytes, content_type = service.get_object(object_key)
    assert len(retrieved_bytes) > 0
    assert "image" in content_type

    # 5. Test delete_object
    deleted = service.delete_object(object_key)
    assert deleted is True


def test_cloudinary_raw_fallback_lifecycle():
    service = CloudinaryStorageService()

    # Upload raw text or arbitrary bytes
    raw_bytes = b"Sample government notification certificate text in plain ASCII."
    object_key = "vault_test/sample_notification.txt"

    uploaded_key = service.upload_bytes(
        file_bytes=raw_bytes,
        object_key=object_key,
        content_type="text/plain",
    )
    assert uploaded_key == object_key

    # Retrieve download URL
    url = service.generate_presigned_download_url(object_key)
    assert "res.cloudinary.com" in url

    # Cleanup
    deleted = service.delete_object(object_key)
    assert deleted is True


def test_storage_service_proxy_routes_to_cloudinary():
    old_provider = settings.STORAGE_PROVIDER
    settings.STORAGE_PROVIDER = "cloudinary"
    try:
        assert isinstance(storage_service.current, CloudinaryStorageService)
    finally:
        settings.STORAGE_PROVIDER = old_provider


def test_direct_upload_signature_and_confirm_lifecycle(client, db_session):
    # Register & Login
    client.post(
        "/auth/register",
        json={
            "email": "direct.upload.citizen@gov.in",
            "phone": "+919876543211",
            "password": "Password123!",
        },
    )
    res_login = client.post(
        "/auth/login",
        json={
            "email": "direct.upload.citizen@gov.in",
            "password": "Password123!",
        },
    )
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Request direct signed upload params from backend (No double upload)
    res_params = client.post(
        "/vault/documents/direct-upload-params",
        headers=headers,
        json={"document_type": "Aadhaar Card", "file_name": "aadhaar_front.png"},
    )
    assert res_params.status_code == 200
    params_data = res_params.json()
    assert "upload_url" in params_data
    assert "signature" in params_data
    assert "api_key" in params_data
    assert "public_id" in params_data
    assert params_data["cloud_name"] == settings.CLOUDINARY_CLOUD_NAME

    # 2. Confirm direct upload metadata to backend (FastAPI writes to DB)
    res_confirm = client.post(
        "/vault/documents/direct-upload-confirm",
        headers=headers,
        json={
            "document_type": "Aadhaar Card",
            "document_number_masked": "XXXX-XXXX-1234",
            "public_id": params_data["public_id"],
            "secure_url": f"https://res.cloudinary.com/{settings.CLOUDINARY_CLOUD_NAME}/image/upload/v1/{params_data['public_id']}.png",
            "file_name": "aadhaar_front.png",
            "file_size_bytes": 102400,
            "mime_type": "image/png",
        },
    )
    assert res_confirm.status_code == 201
    doc_data = res_confirm.json()
    assert doc_data["document_type"] == "Aadhaar Card"
    assert doc_data["file_name"] == "aadhaar_front.png"
    assert doc_data["file_size_bytes"] == 102400
    assert "download_url" in doc_data

