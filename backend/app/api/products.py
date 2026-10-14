from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.core.deps import get_db, get_current_admin_user
from app.models.user import User
from app.models.product import Product, Ingredient, ProductIngredient, ProductSize, ProductTopping
from app.models.category import Category
from app.models.order import OrderItem
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

async def _sync_product_ingredients(db: AsyncSession, product_id: int, ingredients_list: List[str]):
    """
    Đồng bộ hóa danh sách nguyên liệu cho sản phẩm.
    Xóa toàn bộ liên kết cũ rồi tạo lại từ danh sách mới.
    Tự động tạo Ingredient mới vào bảng master nếu chưa tồn tại.
    """
    # Xóa toàn bộ liên kết nguyên liệu hiện tại của sản phẩm
    await db.execute(delete(ProductIngredient).where(ProductIngredient.product_id == product_id))
    
    seen_names = set()
    for raw_name in ingredients_list:
        name = raw_name.strip()
        if not name or name.lower() in seen_names:
            continue  # Bỏ qua tên rỗng hoặc trùng lặp
        seen_names.add(name.lower())

        # Tìm nguyên liệu trong bảng master, nếu chưa có thì tạo mới
        stmt = select(Ingredient).where(Ingredient.name == name)
        res = await db.execute(stmt)
        ing = res.scalar_one_or_none()
        if not ing:
            ing = Ingredient(name=name)
            db.add(ing)
            await db.flush()  # Flush để lấy ing.id trước khi tạo liên kết
            
        assoc = ProductIngredient(product_id=product_id, ingredient_id=ing.id)
        db.add(assoc)

async def _sync_product_sizes(db: AsyncSession, product_id: int, sizes_list: list):
    """
    Đồng bộ hóa danh sách kích thước (size) cho sản phẩm.
    Xóa toàn bộ size cũ rồi tạo lại từ danh sách mới.
    """
    await db.execute(delete(ProductSize).where(ProductSize.product_id == product_id))
    for sz in sizes_list:
        assoc = ProductSize(
            product_id=product_id,
            size_name=sz.size_name.strip(),
            price_multiplier=sz.price_multiplier,
            extra_price=sz.extra_price
        )
        db.add(assoc)

async def _sync_product_toppings(db: AsyncSession, product_id: int, toppings_list: list):
    """
    Đồng bộ hóa danh sách topping cho sản phẩm.
    Xóa toàn bộ topping cũ rồi tạo lại từ danh sách mới.
    """
    await db.execute(delete(ProductTopping).where(ProductTopping.product_id == product_id))
    for tp in toppings_list:
        assoc = ProductTopping(
            product_id=product_id,
            topping_name=tp.topping_name.strip(),
            extra_price=tp.extra_price
        )
        db.add(assoc)

async def _get_product_with_details(db: AsyncSession, product_id: int) -> Optional[Product]:
    """
    Lấy thông tin sản phẩm kèm theo toàn bộ quan hệ liên kết (nguyên liệu, size, topping).
    Xóa cache session trước để đảm bảo dữ liệu luôn mới nhất.
    """
    db.expire_all()
    stmt = (
        select(Product)
        .options(
            selectinload(Product.ingredient_associations).joinedload(ProductIngredient.ingredient),
            selectinload(Product.size_associations),
            selectinload(Product.topping_associations)
        )
        .where(Product.id == product_id)
    )
    res = await db.execute(stmt)
    return res.scalar_one_or_none()

@router.get("", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[int] = Query(None, description="Lọc theo ID danh mục"),
    is_available: Optional[bool] = Query(None, description="Lọc theo trạng thái kinh doanh"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Lấy danh sách sản phẩm với tùy chọn lọc theo danh mục và trạng thái (Public endpoint)."""
    stmt = (
        select(Product)
        .options(
            selectinload(Product.ingredient_associations).joinedload(ProductIngredient.ingredient),
            selectinload(Product.size_associations),
            selectinload(Product.topping_associations)
        )
    )
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if is_available is not None:
        stmt = stmt.where(Product.is_available == is_available)

    stmt = stmt.order_by(Product.id.asc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    products = result.scalars().all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy thông tin chi tiết một sản phẩm theo ID (Public endpoint)."""
    product = await _get_product_with_details(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Tạo sản phẩm mới (chỉ Admin). Tự động tạo và liên kết nguyên liệu, size, topping."""
    # Kiểm tra danh mục tồn tại nếu được cung cấp
    if payload.category_id is not None:
        stmt_cat = select(Category).where(Category.id == payload.category_id)
        res_cat = await db.execute(stmt_cat)
        if not res_cat.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Category ID does not exist")

    # Tạo sản phẩm chính (loại trừ các trường danh sách xử lý riêng)
    product_data = payload.model_dump(exclude={"ingredients", "sizes", "toppings"})
    new_product = Product(**product_data)
    db.add(new_product)
    await db.flush()  # Flush để lấy new_product.id trước khi tạo liên kết

    # Đồng bộ hóa nguyên liệu, size, topping nếu được cung cấp
    if payload.ingredients:
        await _sync_product_ingredients(db, new_product.id, payload.ingredients)
    if payload.sizes:
        await _sync_product_sizes(db, new_product.id, payload.sizes)
    if payload.toppings:
        await _sync_product_toppings(db, new_product.id, payload.toppings)

    await db.commit()
    return await _get_product_with_details(db, new_product.id)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Cập nhật thông tin sản phẩm hiện có (chỉ Admin)."""
    product = await _get_product_with_details(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Kiểm tra danh mục mới có tồn tại không (nếu được thay đổi)
    if payload.category_id is not None and payload.category_id != product.category_id:
        stmt_cat = select(Category).where(Category.id == payload.category_id)
        res_cat = await db.execute(stmt_cat)
        if not res_cat.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Category ID does not exist")

    # Cập nhật các trường cơ bản (không bao gồm danh sách xử lý riêng)
    update_data = payload.model_dump(exclude_unset=True, exclude={"ingredients", "sizes", "toppings"})
    for key, value in update_data.items():
        setattr(product, key, value)

    # Đồng bộ hóa lại nguyên liệu, size, topping nếu được cung cấp trong payload
    if payload.ingredients is not None:
        await _sync_product_ingredients(db, product.id, payload.ingredients)
    if payload.sizes is not None:
        await _sync_product_sizes(db, product.id, payload.sizes)
    if payload.toppings is not None:
        await _sync_product_toppings(db, product.id, payload.toppings)

    await db.commit()
    return await _get_product_with_details(db, product.id)

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Xóa sản phẩm (chỉ Admin). Không thể xóa nếu sản phẩm đã có trong lịch sử đơn hàng."""
    product = await _get_product_with_details(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Kiểm tra xem sản phẩm có nằm trong đơn hàng lịch sử hay không
    order_check = await db.execute(select(OrderItem.id).where(OrderItem.product_id == product_id).limit(1))
    if order_check.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Sản phẩm đã tồn tại trong lịch sử đơn hàng nên không thể xóa do yêu cầu toàn vẹn dữ liệu. Bạn vui lòng chuyển sang trạng thái ngưng bán (Tạm ngưng)."
        )

    try:
        await db.delete(product)
        await db.commit()
    except IntegrityError:
        # Xử lý trường hợp còn ràng buộc dữ liệu (ví dụ: giỏ hàng)
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Không thể xóa sản phẩm do đang có ràng buộc dữ liệu liên quan (giỏ hàng/đơn hàng)."
        )
    return {"message": "Product deleted successfully"}
