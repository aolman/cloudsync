from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Boolean, DateTime, Text, ForeignKey
from datetime import datetime
from uuid import UUID, uuid4
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/cloudsync")

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_date: Mapped[datetime] = mapped_column(DateTime, default=dattime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class FileRecord(Base):
    __tablename__ = "files"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(Integer)
    s3_key: Mapped[str] = mapped_column(String(500), unique=True)  # Path in S3
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    upload_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    
    __table_args__ = (
        {"extend_existing": True}
    )

class ShareLinkRecord(Base):
    __tablename__ = "share_links"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    file_id: Mapped[UUID] = mapped_column(ForeignKey("files.id"))
    share_token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    created_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_date: Mapped[datetime] = mapped_column(DateTime)
    allow_download: Mapped[bool] = mapped_column(Boolean, default=True)
    access_count: Mapped[int] = mapped_column(Integer, default=0)

async def get_db_session() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")

async def close_database():
    await engine.dispose()
    print("Database connections closed.")