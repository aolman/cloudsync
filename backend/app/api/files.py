import os
from litestar import Controller, post, get, delete
from litestar.params import Body
from litestar.datastructures import UploadFile
from ..models.user_models import UserOut
from ..models.file_models import FileUpload, FileOut, FileMetadata, FileListResponse
from ..core.database import get_db_session, FileRecord
from litestar.di import Provide
from litestar.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4, UUID
from ..core.s3_utils import s3_manager
from ..core.auth_middleware import get_current_user
from litestar.status_codes import HTTP_200_OK

class FileController(Controller):
    path = "/files"
    tags = ["Files"]
    dependencies = {"current_user": Provide(get_current_user)}
    
    @post("/upload")
    async def upload_file(
        self,
        current_user: UserOut,
        file: UploadFile = Body(media_type="multipart/form-data"),
        db_session: AsyncSession = Provide(get_db_session)
    ) -> FileOut:
        """
        Upload a new file.
        
        1. Validate file data
        2. Save file metadata to database
        3. Return file info (without sensitive data)
        """
        
        # Validate file data (this should be done in the model)
        if not file.filename or not file.content_type or file.size <= 0:
            raise HTTPException(status_code=400, detail="Invalid file data")
        
        MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_MB")) * 1024 * 1024
        if file.size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="File too large")
        
        # Create new file metadata
        new_file = FileRecord(
            id=uuid4(),
            filename=file.filename,
            content_type=file.content_type,
            size=file.size,
            owner_id=current_user.id,
            s3_key=s3_manager.generate_s3_key(current_user.email, file.filename),
            is_public=False
        )
        
        upload_success = await s3_manager.upload_file(file.file, new_file.s3_key, file.content_type)
        if not upload_success:
            raise HTTPException(status_code=500, detail="Failed to upload file to storage")
        
        # Save to database
        db_session.add(new_file)
        await db_session.commit()
        await db_session.refresh(new_file)  # Get the saved file with all fields
        
        # Return file info (excluding sensitive data)
        return FileOut(
            id=new_file.id,
            filename=new_file.filename,
            content_type=new_file.content_type,
            size=new_file.size,
            upload_date=new_file.upload_date,
            is_public=new_file.is_public
        )
    
    @get()
    async def list_files(
        self,
        current_user: UserOut,
        db_session: AsyncSession = Provide(get_db_session),
        page: int = 1,
        page_size: int = 50
    ) -> FileListResponse:
        
        file_query = select(FileRecord).where(FileRecord.owner_id == current_user.id)
        result = await db_session.execute(file_query)
        result_files = result.scalars().all()
        total_count = len(result_files)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_files = result_files[start:end]
        return_files = []
        
        for file in paginated_files:
            # Convert to FileOut model for response
            file_out = FileOut(
                id=file.id,
                filename=file.filename,
                content_type=file.content_type,
                size=file.size,
                upload_date=file.upload_date,
                is_public=file.is_public
            )
            return_files.append(file_out)
            
        
        return FileListResponse(
            files=return_files,
            total_count=total_count,
            page=page,
            page_size=page_size
        )
        
    @delete("/{file_id:uuid}", status_code=HTTP_200_OK)
    async def delete_file(
        self,
        file_id: UUID,
        current_user: UserOut,
        db_session: AsyncSession = Provide(get_db_session)
    ) -> dict:
        """
        Delete a file by ID.
        """
        
        # Check if file exists and belongs to user
        file_query = select(FileRecord).where(
            FileRecord.id == file_id,
            FileRecord.owner_id == current_user.id
        )
        result = await db_session.execute(file_query)
        file_record = result.scalar_one_or_none()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found or access denied")
        
        delete_success = s3_manager.delete_file(file_record.s3_key)
        if not delete_success:
            raise HTTPException(status_code=500, detail="Failed to delete file from storage")
        
        # Delete the file record from database
        await db_session.delete(file_record)
        await db_session.commit()
        
        return {"detail": "File deleted successfully"}
    
    @get("/{file_id:uuid}/download")
    async def get_download_url(
        self,
        file_id: UUID,
        current_user: UserOut,
        db_session: AsyncSession = Provide(get_db_session)
    ) -> dict:
        file_query = select(FileRecord).where(FileRecord.id == file_id, 
                                              FileRecord.owner_id == current_user.id)
        result = await db_session.execute(file_query)
        file_record = result.scalar_one_or_none()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found or access denied")
        presigned_url = s3_manager.generate_presigned_url(file_record.s3_key)
        if not presigned_url:
            raise HTTPException(status_code=500, detail="Failed to generate download URL")
        return {"download_url": presigned_url}