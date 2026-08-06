import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError
from typing import Dict

# Import routers
from app.api import auth, users, categories, products, upload, ingredients, catalog_sizes_toppings, public_products, cart, vouchers, orders, notifications, ws, chat
from app.api.admin import banners as admin_banners
from app.api.admin import dashboard as admin_dashboard
from app.api.admin import customers as admin_customers
from app.api.admin import reviews as admin_reviews
from app.api.public import banners as public_banners
from app.api.public import reviews as public_reviews
from app.api.customer import reviews as customer_reviews

# Ensure static/uploads directory exists for fallback images
os.makedirs("static/uploads", exist_ok=True)

app = FastAPI(
    title="Pizza Store API",
    description="Backend services for Pizza Store system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
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
app.include_router(chat.router, prefix="/api/chat", tags=["Chatbot AI"])
app.include_router(admin_banners.router, prefix="/api/admin/banners", tags=["Admin - Banners"])
app.include_router(admin_dashboard.router, prefix="/api/admin/dashboard", tags=["Admin - Dashboard"])
app.include_router(admin_customers.router, prefix="/api/admin/customers", tags=["Admin - Customers"])
app.include_router(admin_reviews.router, prefix="/api/admin/reviews", tags=["Admin - Reviews"])
app.include_router(public_reviews.router, prefix="/api/public", tags=["Public - Reviews"])
app.include_router(customer_reviews.router, prefix="/api/customer", tags=["Customer - Reviews"])
app.include_router(public_banners.router, prefix="/api/banners/public", tags=["Public - Banners"])


@app.get("/api/ping", tags=["Health Check"])
async def ping_server() -> Dict[str, str]:
    return {
        "status": "success",
        "message": "Pong! FastAPI server is running."
    }