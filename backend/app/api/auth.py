from ..models.user_models import UserCreate, UserLogin, UserOut
from ..core.security import hash_password, verify_password, create_token
from litestar import Controller, post
from litestar.exceptions import HTTPException

fake_users_db = {}

class AuthController(Controller):
    path = "/auth"
    tags = ["Auth"]
    
    @post("/register")
    async def register(self, data: UserCreate) -> UserOut:
        if data.email in fake_users_db:
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed = hash_password(data.password)
        fake_users_db[data.email] = {"email": data.email, "hashed": hashed}
        return UserOut(id=len(fake_users_db), email=data.email)

    @post("/login")
    async def login(self, data: UserLogin) -> dict:
        db_user = fake_users_db.get(data.email)
        if not db_user or not verify_password(data.password, db_user["hashed"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_token({"sub": data.email})
        return {"access_token": token, "token_type": "bearer"}

# Now you just register the controller instead of individual route handlers
auth_controller = AuthController