# app/main.py

import os
from litestar import Litestar
from litestar.config.cors import CORSConfig

# Import your controllers
from app.api.auth import AuthController
from app.core.database import init_database, close_database, get_db_session

# Create the Litestar app without SQLAlchemy plugin
app = Litestar(
    route_handlers=[AuthController],
    dependencies={"db_session": get_db_session},  # Manual dependency injection
    cors_config=CORSConfig(
        allow_origins=["http://localhost:3000"],  # Your frontend URL
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"]
    ),
    on_startup=[init_database],  # Create tables on startup
    on_shutdown=[close_database],  # Clean up on shutdown
)

# For development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True  # Auto-reload on code changes
    )