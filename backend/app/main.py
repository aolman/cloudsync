from starlite import Starlite
from app.api.auth import auth_router

app = Starlite(route_handlers=[auth_router])