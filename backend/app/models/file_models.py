from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

# Expected Data for when someone uploads a file
class FileUpload(BaseModel):
    filename: str = Field(..., description="Original filename from user")
    content_type: str = Field(..., description="MIME type (e.g. image/jpeg, text/plain)")
    size: int = Field(..., gt=0, description="File size in bytes")

# Information saved in database about file
class FileMetadata(BaseModel):
    id: UUID = Field(default_factory=uuid4, description="Unique file identifier")
    filename: str = Field(..., description="Original filename")
    content_type: str = Field(..., description="MIME type")
    size: int = Field(..., gt=0, description="File size in bytes")
    owner_email: str = Field(..., description="Email of the user who uploaded the file")
    s3_key: str = Field(..., description="Path/key where file is stored in S3")
    upload_date: datetime = Field(default_factory=datetime.now(timezone.utc), description="When file was uploaded")
    is_public: bool = Field(default=False, description="Whether file can be accessed without authentication")
    
    # This allows the model to work with database ORMs
    class Config:
        from_attributes = True

# file info return to users
class FileOut(BaseModel):
    id: UUID
    filename: str
    content_type: str
    size: int
    upload_date: datetime
    is_public: bool

# response for listing multiple files
class FileListResponse(BaseModel):
    files: list[FileOut]
    total_count: int
    page: int = 1
    page_size: int = 50

# creating shareable links
class ShareLinkCreate(BaseModel):
    file_id: UUID
    expires_in_hours: Optional[int] = Field(default=24, gt=0, le=8760)  # Max 1 year
    allow_download: bool = Field(default=True)

# share link info
class ShareLink(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    file_id: UUID
    share_token: str = Field(..., description="Random token for accessing the file")
    created_date: datetime = Field(default_factory=datetime.utcnow)
    expires_date: datetime
    allow_download: bool
    access_count: int = Field(default=0, description="How many times this link was used")
