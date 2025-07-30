# Update your app/api/auth.py file

from ..models.user_models import UserCreate, UserLogin, UserOut
from ..core.security import hash_password, verify_password, create_token
from ..core.database import User, get_db_session
from litestar import Controller, post
from litestar.di import Provide
from litestar.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4

class AuthController(Controller):
    path = "/auth"
    tags = ["Auth"]
    
    @post("/register")
    async def register(
        self, 
        data: UserCreate,
        db_session: AsyncSession = Provide(get_db_session)
    ) -> UserOut:
        """
        Register a new user.
        
        1. Check if email already exists
        2. Hash the password
        3. Save user to database
        4. Return user info (without password)
        """
        
        # Check if user already exists
        existing_user_query = select(User).where(User.email == data.email)
        result = await db_session.execute(existing_user_query)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password and create user
        hashed_password = hash_password(data.password)
        new_user = User(
            id=uuid4(),
            email=data.email,
            hashed_password=hashed_password
        )
        
        # Save to database
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)  # Get the saved user with all fields
        
        # Return user info (excluding password)
        return UserOut(
            id=new_user.id,
            email=new_user.email,
            created_date=new_user.created_date,
            is_active=new_user.is_active
        )

    @post("/login")
    async def login(
        self, 
        data: UserLogin,
        db_session: AsyncSession = Provide(get_db_session)
    ) -> dict:
        """
        Authenticate user and return JWT token.
        
        1. Find user by email
        2. Verify password
        3. Generate JWT token
        4. Return token
        """
        
        # Find user by email
        user_query = select(User).where(User.email == data.email)
        result = await db_session.execute(user_query)
        user = result.scalar_one_or_none()
        
        # Check if user exists and password is correct
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if user account is active
        if not user.is_active:
            raise HTTPException(status_code=401, detail="Account is disabled")
        
        # Generate JWT token
        token = create_token({"sub": user.email, "user_id": str(user.id)})
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email
            }
        }