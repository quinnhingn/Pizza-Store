import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError
from typing import Dict

# Import routers
from app.api import auth, users, categories, products, upload, ingredients, catalog_sizes_toppings, public_products, cart, vouchers, orders, notifications, ws

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

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": "Thao tác không thể thực hiện do ràng buộc dữ liệu toàn vẹn (ví dụ: sản phẩm đang nằm trong lịch sử đơn hàng hoặc giỏ hàng)."}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Lỗi hệ thống nội bộ: {str(exc)}"}
    )

# Mount static files for local fallback storage
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users & Addresses"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(public_products.router, prefix="/api/public/products", tags=["Public - Products"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["Master Catalog - Ingredients"])
app.include_router(catalog_sizes_toppings.router_sizes, prefix="/api/sizes", tags=["Master Catalog - Sizes"])
app.include_router(catalog_sizes_toppings.router_toppings, prefix="/api/toppings", tags=["Master Catalog - Toppings"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(vouchers.router, prefix="/api/vouchers", tags=["Vouchers"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(ws.router, prefix="/api/ws", tags=["WebSockets"])

@app.get("/api/ping", tags=["Health Check"])
async def ping_server() -> Dict[str, str]:
    return {
        "status": "success",
        "message": "Pong! FastAPI server is running."
    }