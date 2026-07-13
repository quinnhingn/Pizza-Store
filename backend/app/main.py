from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict

# Initialize FastAPI Application
app = FastAPI(
    title="Pizza Store API",
    description="Backend services for Pizza Store system",
    version="1.0.0"
)

# Configure CORS for Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health-Check Endpoint
@app.get("/api/ping", tags=["Health Check"])
async def ping_server() -> Dict[str, str]:
    """
    Verify that the FastAPI server is running correctly.
    """
    return {
        "status": "success",
        "message": "Pong! FastAPI server is running."
    }