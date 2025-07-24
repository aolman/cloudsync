from litestar import Litestar
from app.api.auth import auth_controller

app = Litestar(route_handlers=[auth_controller])