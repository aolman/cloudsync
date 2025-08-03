import os
from sqlalchemy import select
from dotenv import load_dotenv
from litestar import Request
from litestar.di import Provide
from sqlalchemy.ext.asyncio import AsyncSession
from litestar.exceptions import HTTPException
from ..core.security import decode_token
from ..core.database import get_db_session, User
from ..models.user_models import UserOut

async def get_current_user(request: Request, db_session: AsyncSession = Provide(get_db_session)) -> UserOut:
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if token.startswith("Bearer "):
        token = token[7:]
    else:
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    sub = decode_token(token)
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_query = select(User).where(User.email == sub)
    result = await db_session.execute(user_query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User accoint is disabled")
    
    return UserOut(
        id=user.id,
        email=user.email,
        created_date=user.created_date,
        is_active=user.is_active
    )