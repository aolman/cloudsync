from ..models.user_models import UserCreate, UserLogin, UserOut
from ..core.security import hash_password, verify_password, create_token
from starlite import post, Router, HTTPException

fake_users_db = {}

@post("/register", tags=["Auth"])
async def register(user: UserCreate) -> UserOut:
    if user.email in fake_users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(user.password)
    fake_users_db[user.email] = {"email": user.email, "hashed": hashed}
    return UserOut(id=len(fake_users_db), email=user.email)

@post("/login", tags=["Auth"])
async def login(user: UserLogin) -> dict:
    db_user = fake_users_db.get(user.email)
    if not db_user or not verify_password(user.password, db_user["hashed"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

auth_router = Router(path="/auth", route_handlers=[register, login])