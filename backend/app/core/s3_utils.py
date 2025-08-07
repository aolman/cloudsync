import boto3
import os
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional, BinaryIO
import uuid
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# handles S3 operations for file storage
class S3Manager:

    def __init__(self):
        self.bucket_name = os.getenv("S3_BUCKET_NAME")
        if not self.bucket_name:
            raise ValueError("S3_BUCKET_NAME env variable required")

        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_REGION")
            )
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Successfully connected to S3 bucket: {self.bucket_name}")
        except NoCredentialsError:
            raise ValueError("AWS credentials not found. Check your environment variables.")
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                raise ValueError(f"S3 bucket '{self.bucket_name}' does not exist")
            raise e
    
    # generate S3 key
    def generate_s3_key(self, user_email: str, filename: str) -> str:
        clean_email = user_email.replace("@", "_at_").replace(".", "_")
        unique_id = str(uuid.uuid4())
        return f"users/{clean_email}/{unique_id}_{filename}"

    # Upload file to S3, return true if successful, false otherwise
    async def upload_file(self, file_data: BinaryIO, s3_key: str, content_type: str):
        try:
            self.s3_client.upload_fileobj(
                file_data,
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': content_type,
                    'Metadata': {
                        'upload_date': datetime.now().isoformat(),
                        'original_content_type': content_type
                    }
                }
            )
            logger.info(f"Successfully uploaded file to S3: {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            return False

    # generate presigned url for downloading file, expire after 1 hr default
    def generate_presigned_url(self, s3_key: str, filename: str=None, expiration: int=3600) -> Optional[str]:
        try:
            params = {
                'Bucket': self.bucket_name,
                'Key': s3_key
            }

            if filename:
                params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'
            else:
                params['ResponseContentDisposition'] = 'attachment'

            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expiration
            )
            logger.info(f"Generated presigned URL for: {s3_key}")
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None

    def delete_file(self, s3_key: str) -> bool:
        try: 
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            logger.info(f"Successfully deleted file from S3: {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            return False

    def file_exists(self, s3_key: str) -> bool:
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            logger.error(f"Error checking file existence: {e}")
            return False

    def get_file_size(self, s3_key: str) -> Optional[int]:
        try:
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return response['ContentLength']
        except ClientError as e:
            logger.error(f"Failed to get file size: {e}")
            return None

s3_manager = S3Manager()