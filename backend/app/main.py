from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict

# Import routers
from app.api import auth

app = FastAPI(
    title="Pizza Store API",
    description="Backend services for Pizza Store system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/api/ping", tags=["Health Check"])
async def ping_server() -> Dict[str, str]:
    return {
        "status": "success",
        "message": "Pong! FastAPI server is running."
    }