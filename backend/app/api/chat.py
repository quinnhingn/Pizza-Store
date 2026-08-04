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
    role: str  # 'user' or 'model'
    text: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply_message: str
    products: List[dict] = []
    suggested_queries: List[str] = []

@router.post("/", response_model=ChatResponse)
async def chat_with_bot(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else None
    
    if not user_id and not req.session_id:
        raise HTTPException(status_code=400, detail="Missing session_id for guest user")
    
    # 1. Get intent from Gemini (with conversation history for context)
    try:
        # Build history for Gemini (exclude the current message, it's sent separately)
        gemini_history = []
        if req.history:
            for msg in req.history[:-1]:  # Exclude last (current) message
                gemini_history.append({"role": msg.role, "text": msg.text})
        
        intent_data = get_chat_intent(req.message, gemini_history)
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        # Fallback: return a friendly message without crashing
        return ChatResponse(
            reply_message="Xin lỗi anh/chị, hệ thống AI đang tải lại. Anh/chị vui lòng thử lại sau vài giây nhé!",
            products=[],
            suggested_queries=["Xem menu Pizza", "Có món gì ngon?", "Gợi ý món rẻ"]
        )

    reply_message = intent_data.get("reply_message", "Dạ em chưa hiểu rõ yêu cầu, anh/chị có thể nói rõ hơn được không ạ?")
    max_price = intent_data.get("max_price")
    min_price = intent_data.get("min_price")
    excluded_ingredients = intent_data.get("excluded_ingredients") or []
    included_ingredients = intent_data.get("included_ingredients") or []
    category_keyword = intent_data.get("category_keyword")
    suggested_queries = intent_data.get("suggested_queries") or []

    # 2. Query Database with eager loading for ingredients
    stmt = select(Product).where(Product.is_available == True).options(
        selectinload(Product.ingredient_associations).selectinload(ProductIngredient.ingredient)
    )
    
    if max_price:
        stmt = stmt.where(Product.price <= max_price)
    if min_price:
        stmt = stmt.where(Product.price >= min_price)
        
    if category_keyword:
        stmt = stmt.join(Category).where(Category.name.ilike(f"%{category_keyword}%"))
        
    result = await db.execute(stmt)
    products = result.scalars().unique().all()
    
    # 3. Filter by ingredients in memory
    filtered_products = []
    for p in products:
        ingredient_names = [assoc.ingredient.name.lower() for assoc in p.ingredient_associations if assoc.ingredient]
        p_ingredients_str = " ".join(ingredient_names)
        
        # Check excluded (any match → skip)
        if excluded_ingredients and any(excl.lower() in p_ingredients_str for excl in excluded_ingredients):
            continue
            
        # Check included: ALL must match (AND logic)
        if included_ingredients:
            if not all(any(incl.lower() in ing_name for ing_name in ingredient_names) for incl in included_ingredients):
                continue
                
        filtered_products.append(p)

    # 4. Build product response dicts
    product_dicts = []
    for p in filtered_products[:10]:
        product_dicts.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "base_price": float(p.price),
            "image_url": p.image_url,
            "category_id": p.category_id,
            "ingredients": p.ingredients
        })
        
    # 5. Save Chat History (non-blocking: don't crash if save fails)
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
