import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict

# Import routers
from app.api import auth, users, categories, products, upload, ingredients, catalog_sizes_toppings

# Ensure static/uploads directory exists for fallback images
os.makedirs("static/uploads", exist_ok=True)

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

# Mount static files for local fallback storage
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users & Addresses"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["Master Catalog - Ingredients"])
app.include_router(catalog_sizes_toppings.router_sizes, prefix="/api/sizes", tags=["Master Catalog - Sizes"])
app.include_router(catalog_sizes_toppings.router_toppings, prefix="/api/toppings", tags=["Master Catalog - Toppings"])



@app.get("/api/ping", tags=["Health Check"])
async def ping_server() -> Dict[str, str]:
    return {
        "status": "success",
        "message": "Pong! FastAPI server is running."
    }