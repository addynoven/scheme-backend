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


storage_service = S3StorageService()
