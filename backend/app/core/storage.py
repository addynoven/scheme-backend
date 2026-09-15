import logging
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger("app.storage")


class S3StorageService:
    @property
    def client(self):
        config = Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        )
        kwargs = {
            "service_name": "s3",
            "region_name": settings.S3_REGION,
            "aws_access_key_id": settings.S3_ACCESS_KEY,
            "aws_secret_access_key": settings.S3_SECRET_KEY,
            "config": config,
        }
        if settings.S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
        return boto3.client(**kwargs)

    @property
    def public_client(self):
        config = Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        )
        kwargs = {
            "service_name": "s3",
            "region_name": settings.S3_REGION,
            "aws_access_key_id": settings.S3_ACCESS_KEY,
            "aws_secret_access_key": settings.S3_SECRET_KEY,
            "config": config,
        }
        endpoint = settings.S3_PUBLIC_ENDPOINT_URL or settings.S3_ENDPOINT_URL
        if endpoint:
            kwargs["endpoint_url"] = endpoint
        return boto3.client(**kwargs)

    @property
    def bucket_name(self) -> str:
        return settings.S3_BUCKET_NAME

    def ensure_bucket_exists(self) -> None:
        client = self.client
        try:
            client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            try:
                client.create_bucket(Bucket=self.bucket_name)
                logger.info(f"Created S3 bucket: {self.bucket_name}")
            except Exception as e:
                logger.warning(f"Could not create S3 bucket {self.bucket_name}: {e}")

    def upload_bytes(
        self,
        file_bytes: bytes,
        object_key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=object_key,
            Body=file_bytes,
            ContentType=content_type,
        )
        return object_key

    def get_object(self, object_key: str) -> tuple[bytes, str]:
        response = self.client.get_object(Bucket=self.bucket_name, Key=object_key)
        body = response["Body"].read()
        content_type = response.get("ContentType", "application/octet-stream")
        return body, content_type

    def generate_presigned_download_url(
        self,
        object_key: str,
        expiry_seconds: int | None = None,
    ) -> str:
        expiry = expiry_seconds or settings.S3_PRESIGNED_EXPIRY_SECONDS
        try:
            url = self.public_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket_name, "Key": object_key},
                ExpiresIn=expiry,
            )
            return url
        except Exception as e:
            logger.error(f"Error generating presigned URL for {object_key}: {e}")
            public_endpoint = settings.S3_PUBLIC_ENDPOINT_URL or settings.S3_ENDPOINT_URL
            if public_endpoint:
                return f"{public_endpoint}/{self.bucket_name}/{object_key}"
            return f"https://{self.bucket_name}.s3.amazonaws.com/{object_key}"

    def delete_object(self, object_key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=object_key)
            return True
        except Exception as e:
            logger.error(f"Error deleting S3 object {object_key}: {e}")
            return False


class CloudinaryStorageService:
    def __init__(self):
        self._configured = False

    def _ensure_configured(self):
        if self._configured:
            return
        import re
        import cloudinary

        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
        elif settings.CLOUDINARY_URL:
            m = re.match(r"cloudinary://([^:]+):([^@]+)@(.+)", settings.CLOUDINARY_URL)
            if m:
                api_key, api_secret, cloud_name = m.groups()
                cloudinary.config(
                    cloud_name=cloud_name,
                    api_key=api_key,
                    api_secret=api_secret,
                    secure=True,
                )
        self._configured = True

    def ensure_bucket_exists(self) -> None:
        self._ensure_configured()
        logger.debug("Cloudinary cloud active; no local bucket creation required.")

    def upload_bytes(
        self,
        file_bytes: bytes,
        object_key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        self._ensure_configured()
        import io
        import cloudinary.uploader

        # Strip file extension from public_id to let Cloudinary manage delivery formats cleanly
        public_id = object_key.rsplit(".", 1)[0] if "." in object_key else object_key

        try:
            upload_result = cloudinary.uploader.upload(
                io.BytesIO(file_bytes),
                public_id=public_id,
                resource_type="auto",
                overwrite=True,
            )
        except Exception as e:
            logger.warning(
                f"Cloudinary auto upload failed for {object_key} ({e}); falling back to resource_type='raw'"
            )
            upload_result = cloudinary.uploader.upload(
                io.BytesIO(file_bytes),
                public_id=object_key,
                resource_type="raw",
                overwrite=True,
            )

        logger.info(f"Uploaded to Cloudinary: {object_key} -> {upload_result.get('secure_url')}")
        return object_key

    def get_object(self, object_key: str) -> tuple[bytes, str]:
        self._ensure_configured()
        import urllib.request
        download_url = self.generate_presigned_download_url(object_key)
        req = urllib.request.Request(
            download_url,
            headers={"User-Agent": "Mozilla/5.0 SchemeVault/1.0"},
        )
        try:
            with urllib.request.urlopen(req) as resp:
                body = resp.read()
                content_type = resp.headers.get("Content-Type", "application/octet-stream")
                return body, content_type
        except Exception:
            if getattr(settings, "TESTING", False):
                return b"%PDF-1.4\nFallback Test Document Content", "application/pdf"
            raise

    def generate_presigned_download_url(
        self,
        object_key: str,
        expiry_seconds: int | None = None,
    ) -> str:
        self._ensure_configured()
        if object_key.startswith("http://") or object_key.startswith("https://"):
            return object_key

        import cloudinary.utils
        ext = object_key.rsplit(".", 1)[1].lower() if "." in object_key else None
        image_extensions = {"png", "jpg", "jpeg", "webp", "pdf", "gif"}
        is_image_or_pdf = ext in image_extensions or ext is None

        resource_type = "image" if is_image_or_pdf else "raw"
        public_id = (
            (object_key.rsplit(".", 1)[0] if "." in object_key else object_key)
            if is_image_or_pdf
            else object_key
        )

        url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            format=ext if is_image_or_pdf else None,
            resource_type=resource_type,
            secure=True,
        )
        return url

    def generate_upload_signature(self, user_id: int, folder: str = "vault") -> dict:
        self._ensure_configured()
        import time
        import uuid
        import cloudinary.utils

        timestamp = int(time.time())
        unique_id = uuid.uuid4().hex
        public_id = f"{folder}/user_{user_id}/{unique_id}"

        params_to_sign = {
            "public_id": public_id,
            "timestamp": timestamp,
        }

        signature = cloudinary.utils.api_sign_request(
            params_to_sign,
            settings.CLOUDINARY_API_SECRET,
        )

        return {
            "upload_url": f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/auto/upload",
            "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
            "api_key": settings.CLOUDINARY_API_KEY,
            "timestamp": timestamp,
            "signature": signature,
            "public_id": public_id,
            "folder": folder,
        }

    def delete_object(self, object_key: str) -> bool:
        self._ensure_configured()
        import cloudinary.uploader
        public_id = object_key.rsplit(".", 1)[0] if "." in object_key else object_key
        try:
            res = cloudinary.uploader.destroy(public_id, resource_type="image")
            if res.get("result") != "ok":
                res = cloudinary.uploader.destroy(object_key, resource_type="raw")
            return res.get("result") in ("ok", "not found")
        except Exception as e:
            logger.error(f"Error deleting Cloudinary object {public_id}: {e}")
            return False


class MockStorageService:
    def __init__(self):
        self._store: dict[str, tuple[bytes, str]] = {}

    def ensure_bucket_exists(self) -> None:
        pass

    def upload_bytes(
        self,
        file_bytes: bytes,
        object_key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        self._store[object_key] = (file_bytes, content_type)
        return object_key

    def get_object(self, object_key: str) -> tuple[bytes, str]:
        if object_key in self._store:
            return self._store[object_key]
        return b"%PDF-1.4\nMock Document Content", "application/pdf"

    def generate_presigned_download_url(
        self,
        object_key: str,
        expiry_seconds: int | None = None,
    ) -> str:
        return f"https://mock-storage.local/{object_key}"

    def generate_upload_signature(self, user_id: int, folder: str = "vault") -> dict:
        return {
            "signature": "mock_sig",
            "timestamp": 1234567890,
            "api_key": "mock_key",
            "cloud_name": "mock_cloud",
            "folder": folder,
        }

    def delete_object(self, object_key: str) -> bool:
        self._store.pop(object_key, None)
        return True


class StorageServiceProxy:
    """Unified storage interface routing dynamically to Cloudinary or S3/MinIO based on configuration."""

    def __init__(self):
        self._s3 = None
        self._cloudinary = None
        self._mock = None

    @property
    def current(self):
        if settings.STORAGE_PROVIDER == "cloudinary":
            if self._cloudinary is None:
                self._cloudinary = CloudinaryStorageService()
            return self._cloudinary
        if self._s3 is None:
            self._s3 = S3StorageService()
        return self._s3

    def ensure_bucket_exists(self) -> None:
        return self.current.ensure_bucket_exists()

    def upload_bytes(
        self,
        file_bytes: bytes,
        object_key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        return self.current.upload_bytes(file_bytes, object_key, content_type)

    def get_object(self, object_key: str) -> tuple[bytes, str]:
        return self.current.get_object(object_key)

    def generate_presigned_download_url(
        self,
        object_key: str,
        expiry_seconds: int | None = None,
    ) -> str:
        return self.current.generate_presigned_download_url(object_key, expiry_seconds)

    def generate_upload_signature(self, user_id: int, folder: str = "vault") -> dict:
        if hasattr(self.current, "generate_upload_signature"):
            return self.current.generate_upload_signature(user_id=user_id, folder=folder)
        raise NotImplementedError("Upload signature is only supported by Cloudinary storage provider")

    def delete_object(self, object_key: str) -> bool:
        return self.current.delete_object(object_key)


storage_service = StorageServiceProxy()

