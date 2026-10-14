from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
import logging

from app.core.deps import get_db, get_current_user_optional
from app.models.user import User
from app.models.product import Product, ProductIngredient, Ingredient
from app.models.category import Category
from app.models.chat_history import ChatHistory
from app.services.gemini_service import get_chat_intent

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatMessage(BaseModel):
    """Mô hình một tin nhắn trong lịch sử hội thoại."""
    role: str  # 'user' hoặc 'model'
    text: str

class ChatRequest(BaseModel):
    """Payload yêu cầu chat từ client."""
    message: str
    session_id: Optional[str] = None  # Dùng cho guest (không đăng nhập)
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    """Phản hồi từ chatbot AI."""
    reply_message: str
    products: List[dict] = []
    suggested_queries: List[str] = []

@router.post("/", response_model=ChatResponse)
async def chat_with_bot(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Xử lý yêu cầu chat với AI chatbot.
    Luồng xử lý: Phân tích intent -> Truy vấn DB -> Lọc sản phẩm -> Lưu lịch sử -> Trả về kết quả.
    """
    user_id = current_user.id if current_user else None
    
    # Yêu cầu session_id nếu là guest (không có tài khoản)
    if not user_id and not req.session_id:
        raise HTTPException(status_code=400, detail="Missing session_id for guest user")
    
    # Bước 1: Gửi tin nhắn tới Gemini AI để phân tích ý định và trích xuất các bộ lọc
    try:
        # Xây dựng lịch sử hội thoại cho Gemini (loại bỏ tin nhắn cuối vì sẽ gửi riêng)
        gemini_history = []
        if req.history:
            for msg in req.history[:-1]:  # Loại bỏ tin nhắn hiện tại, chỉ lấy lịch sử
                gemini_history.append({"role": msg.role, "text": msg.text})
        
        intent_data = await get_chat_intent(req.message, gemini_history)
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        # Fallback thân thiện khi AI gặp lỗi, không để crash toàn bộ request
        return ChatResponse(
            reply_message="Xin lỗi anh/chị, hệ thống AI đang tải lại. Anh/chị vui lòng thử lại sau vài giây nhé!",
            products=[],
            suggested_queries=["Xem menu Pizza", "Có món gì ngon?", "Gợi ý món rẻ"]
        )

    # Trích xuất các thông tin từ kết quả phân tích intent của Gemini
    reply_message = intent_data.get("reply_message", "Dạ em chưa hiểu rõ yêu cầu, anh/chị có thể nói rõ hơn được không ạ?")
    max_price = intent_data.get("max_price")
    min_price = intent_data.get("min_price")
    excluded_ingredients = intent_data.get("excluded_ingredients") or []
    included_ingredients = intent_data.get("included_ingredients") or []
    category_keyword = intent_data.get("category_keyword")
    suggested_queries = intent_data.get("suggested_queries") or []

    # Bước 2: Truy vấn cơ sở dữ liệu với eager loading cho nguyên liệu
    # Lưu ý: size_associations và topping_associations đã dùng lazy="selectin" trong model
    # nên không cần khai báo selectinload thêm ở đây.
    stmt = select(Product).where(Product.is_available == True).options(
        selectinload(Product.ingredient_associations).selectinload(ProductIngredient.ingredient)
    )
    
    # Áp dụng bộ lọc giá nếu AI trích xuất được
    if max_price:
        stmt = stmt.where(Product.price <= max_price)
    if min_price:
        stmt = stmt.where(Product.price >= min_price)
    
    # Lọc theo danh mục nếu AI xác định được danh mục
    if category_keyword:
        stmt = stmt.join(Category).where(Category.name.ilike(f"%{category_keyword}%"))
        
    result = await db.execute(stmt)
    products = result.scalars().unique().all()
    
    # Bước 3: Lọc sản phẩm theo nguyên liệu trong bộ nhớ (không thể dùng SQL dễ dàng)
    filtered_products = []
    for p in products:
        ingredient_names = [assoc.ingredient.name.lower() for assoc in p.ingredient_associations if assoc.ingredient]
        p_ingredients_str = " ".join(ingredient_names)
        
        # Bỏ qua nếu sản phẩm chứa nguyên liệu khách không muốn (loại trừ - OR logic)
        if excluded_ingredients and any(excl.lower() in p_ingredients_str for excl in excluded_ingredients):
            continue
            
        # Bỏ qua nếu sản phẩm thiếu nguyên liệu khách muốn (bao gồm - AND logic)
        if included_ingredients:
            if not all(any(incl.lower() in ing_name for ing_name in ingredient_names) for incl in included_ingredients):
                continue
                
        filtered_products.append(p)

    # Bước 4: Chuyển đổi danh sách sản phẩm sang dict để trả về
    product_dicts = []
    for p in filtered_products[:10]:  # Giới hạn tối đa 10 sản phẩm
        product_dicts.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": float(p.price),
            "base_price": float(p.price),  # alias for frontend compatibility
            "image_url": p.image_url,
            "category_id": p.category_id,
            "is_available": p.is_available,
            "ingredients": p.ingredients,
            "sizes": [{"id": s.id, "size_name": s.size_name, "price_multiplier": float(s.price_multiplier), "extra_price": float(s.extra_price)} for s in p.sizes],
            "toppings": [{"id": t.id, "topping_name": t.topping_name, "extra_price": float(t.extra_price)} for t in p.toppings]
        })
        
    # Bước 5: Lưu lịch sử chat vào DB (không blocking - không crash nếu lưu thất bại)
    try:
        chat_log = ChatHistory(
            user_id=user_id,
            session_id=req.session_id,
            user_message=req.message,
            ai_response=reply_message,
            filters_applied={
                "max_price": max_price,
                "min_price": min_price,
                "excluded_ingredients": excluded_ingredients,
                "included_ingredients": included_ingredients,
                "category_keyword": category_keyword,
                "products_returned": len(product_dicts)
            }
        )
        db.add(chat_log)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to save chat history: {e}")
        await db.rollback()
    
    return ChatResponse(
        reply_message=reply_message,
        products=product_dicts,
        suggested_queries=suggested_queries
    )
