import asyncio
import os
import sys
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from dotenv import load_dotenv

from app.models.category import Category
from app.models.product import (
    Product, Ingredient, ProductIngredient, Size, Topping, ProductSize, ProductTopping
)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ Lỗi: Không tìm thấy DATABASE_URL trong .env")
    sys.exit(1)

# 1. Master Categories
CATEGORIES_DATA = [
    {"name": "Pizza", "description": "Các dòng Pizza nướng củi thơm lừng phong cách Ý và Mỹ", "icon": "Pizza"},
    {"name": "Gà Rán", "description": "Gà rán giòn rụm tẩm xốt đậm đà phong cách Hàn - Mỹ", "icon": "Drumstick"},
    {"name": "Mì Ý", "description": "Mì Spaghetti và nui xốt kem phô mai bò băm thượng hạng", "icon": "Utensils"},
    {"name": "Món Phụ", "description": "Bánh mì bơ tỏi, khoai tây chiên và đồ ăn khai vị", "icon": "Cookie"},
    {"name": "Đồ Uống", "description": "Nước ngọt có ga, trà trái cây và soda giải khát", "icon": "CupSoda"},
]

# 2. Master Sizes
SIZES_DATA = [
    {"name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
    {"name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
    {"name": "Size L", "mult": Decimal("1.35"), "extra": Decimal("0")},
    {"name": "Suất tiêu chuẩn", "mult": Decimal("1.00"), "extra": Decimal("0")},
    {"name": "Suất lớn", "mult": Decimal("1.00"), "extra": Decimal("30000")},
    {"name": "1 Miếng", "mult": Decimal("1.00"), "extra": Decimal("0")},
    {"name": "Combo 3 Miếng", "mult": Decimal("1.00"), "extra": Decimal("75000")},
    {"name": "Combo 6 Miếng", "mult": Decimal("1.00"), "extra": Decimal("180000")},
    {"name": "Suất 4 miếng", "mult": Decimal("1.00"), "extra": Decimal("0")},
    {"name": "Suất 8 miếng", "mult": Decimal("1.00"), "extra": Decimal("35000")},
]

# 3. Master Toppings
TOPPINGS_DATA = [
    {"name": "Viền phô mai", "extra": Decimal("35000")},
    {"name": "Viền xúc xích", "extra": Decimal("30000")},
    {"name": "Thêm phô mai Mozzarella", "extra": Decimal("25000")},
    {"name": "Thêm phô mai Parmesan", "extra": Decimal("15000")},
    {"name": "Thêm tôm sú", "extra": Decimal("40000")},
    {"name": "Thêm xúc xích Pepperoni", "extra": Decimal("30000")},
    {"name": "Thêm mật ong nguyên chất", "extra": Decimal("15000")},
    {"name": "Sốt phô mai cay", "extra": Decimal("10000")},
    {"name": "Sốt tỏi mật ong", "extra": Decimal("10000")},
    {"name": "Thêm thịt bò băm", "extra": Decimal("25000")},
    {"name": "Thêm sốt bơ tỏi", "extra": Decimal("8000")},
    {"name": "Thêm nấm hương", "extra": Decimal("15000")},
    {"name": "Thêm ngô ngọt", "extra": Decimal("10000")},
]

# 4. Master Ingredients (All unique ingredients used in our 10 products)
INGREDIENTS_DATA = [
    "Tôm sú", "Mực ống", "Sốt Pesto", "Phô mai Mozzarella", "Ớt chuông",
    "Thịt bò nướng", "Sốt BBQ", "Hành tây", "Nấm hương",
    "Ức gà nướng", "Sốt tiêu đen", "Nấm mỡ",
    "Xúc xích Pepperoni", "Sốt cà chua Ý", "Lá Oregano",
    "Phô mai Cheddar", "Phô mai Parmesan", "Phô mai Gorgonzola",
    "Ngô ngọt", "Dứa nhiệt đới", "Cà chua bi",
    "Đùi gà tẩm bột", "Sốt cay Gochujang", "Vừng rang",
    "Mì Spaghetti", "Thịt bò băm",
    "Sốt kem sữa nấm Truffle", "Ngò rí",
    "Bánh mì Baguette", "Bơ nhạt", "Tỏi băm"
]

# 5. 10 Curated Products
PRODUCTS_DATA = [
    {
        "name": "Pizza Hải Sản Pesto Thượng Hạng",
        "description": "Tôm sú tươi giòn, mực ống thái khoanh kết hợp với xốt Pesto xanh béo ngậy và lớp phô mai Mozzarella kéo sợi thơm lừng.",
        "price": Decimal("210000"),
        "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Tôm sú", "Mực ống", "Sốt Pesto", "Phô mai Mozzarella", "Ớt chuông"],
        "sizes": [
            {"size_name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.35"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Viền phô mai", "extra": Decimal("35000")},
            {"topping_name": "Thêm phô mai Mozzarella", "extra": Decimal("25000")},
            {"topping_name": "Thêm tôm sú", "extra": Decimal("40000")}
        ]
    },
    {
        "name": "Pizza Bò Nướng BBQ Mỹ",
        "description": "Thịt bò hảo hạng nướng thơm, hòa quyện với xốt BBQ đậm đà phong cách Texas cùng nấm hương và hành tây giòn rụm.",
        "price": Decimal("190000"),
        "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Thịt bò nướng", "Sốt BBQ", "Hành tây", "Nấm hương", "Phô mai Mozzarella"],
        "sizes": [
            {"size_name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.35"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Viền phô mai", "extra": Decimal("35000")},
            {"topping_name": "Thêm phô mai Mozzarella", "extra": Decimal("25000")},
            {"topping_name": "Thêm nấm hương", "extra": Decimal("15000")}
        ]
    },
    {
        "name": "Pizza Gà Nướng Tiêu Đen Xốt Nấm",
        "description": "Ức gà tẩm ướp xốt tiêu đen thơm nồng cay nhẹ, phủ kín nấm mỡ tươi và phô mai Mozzarella nướng vàng óng.",
        "price": Decimal("170000"),
        "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Ức gà nướng", "Sốt tiêu đen", "Nấm mỡ", "Phô mai Mozzarella"],
        "sizes": [
            {"size_name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.30"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Viền xúc xích", "extra": Decimal("30000")},
            {"topping_name": "Thêm phô mai Mozzarella", "extra": Decimal("25000")}
        ]
    },
    {
        "name": "Pizza Pepperoni Cổ Điển (Ý)",
        "description": "Bánh pizza truyền thống của Ý với xúc xích bò lên men Pepperoni đỏ rực, xốt cà chua tươi chín mọng và lá Oregano.",
        "price": Decimal("180000"),
        "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Xúc xích Pepperoni", "Sốt cà chua Ý", "Phô mai Mozzarella", "Lá Oregano"],
        "sizes": [
            {"size_name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.35"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Viền phô mai", "extra": Decimal("35000")},
            {"topping_name": "Thêm xúc xích Pepperoni", "extra": Decimal("30000")}
        ]
    },
    {
        "name": "Pizza Phô Mai 4 Vị Thượng Hạng (Quattro Formaggi)",
        "description": "Sự kết hợp đỉnh cao của 4 loại phô mai hảo hạng: Mozzarella, Cheddar, Parmesan và Gorgonzola thơm béo ngây ngất.",
        "price": Decimal("200000"),
        "image_url": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Phô mai Mozzarella", "Phô mai Cheddar", "Phô mai Parmesan", "Phô mai Gorgonzola"],
        "sizes": [
            {"size_name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.35"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Thêm mật ong nguyên chất", "extra": Decimal("15000")},
            {"topping_name": "Viền phô mai", "extra": Decimal("35000")}
        ]
    },
    {
        "name": "Pizza Rau Củ Nhiệt Đới (Chay)",
        "description": "Sự thanh mát từ ngô ngọt giòn, dứa nhiệt đới chua ngọt hài hòa cùng nấm mỡ tươi và cà chua bi trên nền phô mai béo nhẹ.",
        "price": Decimal("140000"),
        "image_url": "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Ngô ngọt", "Dứa nhiệt đới", "Nấm mỡ", "Cà chua bi", "Phô mai Mozzarella"],
        "sizes": [
            {"size_name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.30"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Thêm phô mai Mozzarella", "extra": Decimal("25000")},
            {"topping_name": "Thêm ngô ngọt", "extra": Decimal("10000")}
        ]
    },
    {
        "name": "Gà Rán Giòn Sốt Cay Hàn Quốc",
        "description": "Đùi gà tẩm bột chiên giòn rụm bên ngoài, mọng nước bên trong, áo đều lớp xốt ớt cay Gochujang rắc vừng rang thơm bùi.",
        "price": Decimal("45000"),
        "image_url": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
        "category": "Gà Rán",
        "ingredients": ["Đùi gà tẩm bột", "Sốt cay Gochujang", "Vừng rang"],
        "sizes": [
            {"size_name": "1 Miếng", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Combo 3 Miếng", "mult": Decimal("1.00"), "extra": Decimal("75000")},
            {"size_name": "Combo 6 Miếng", "mult": Decimal("1.00"), "extra": Decimal("180000")}
        ],
        "toppings": [
            {"topping_name": "Sốt phô mai cay", "extra": Decimal("10000")},
            {"topping_name": "Sốt tỏi mật ong", "extra": Decimal("10000")}
        ]
    },
    {
        "name": "Mì Ý Bò Băm Sốt Cà Chua (Bolognese)",
        "description": "Sợi mì Spaghetti dai ngon chuẩn Ý sốt cùng thịt bò băm nấu chậm với cà chua tươi thơm lừng, rắc phô mai bào béo bùi.",
        "price": Decimal("85000"),
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3d5d6281298?w=800&auto=format&fit=crop&q=80",
        "category": "Mì Ý",
        "ingredients": ["Mì Spaghetti", "Thịt bò băm", "Sốt cà chua Ý", "Phô mai Parmesan"],
        "sizes": [
            {"size_name": "Suất tiêu chuẩn", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Suất lớn", "mult": Decimal("1.00"), "extra": Decimal("30000")}
        ],
        "toppings": [
            {"topping_name": "Thêm thịt bò băm", "extra": Decimal("25000")},
            {"topping_name": "Thêm phô mai Parmesan", "extra": Decimal("15000")}
        ]
    },
    {
        "name": "Mì Ý Hải Sản Sốt Kem Nấm Truffle",
        "description": "Spaghetti hải sản tôm sú đẫm trong xốt kem sữa nấm Truffle quý hiếm béo thơm sang trọng khó cưỡng.",
        "price": Decimal("110000"),
        "image_url": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80",
        "category": "Mì Ý",
        "ingredients": ["Mì Spaghetti", "Tôm sú", "Sốt kem sữa nấm Truffle", "Ngò rí"],
        "sizes": [
            {"size_name": "Suất tiêu chuẩn", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Suất lớn", "mult": Decimal("1.00"), "extra": Decimal("35000")}
        ],
        "toppings": [
            {"topping_name": "Thêm tôm sú", "extra": Decimal("40000")},
            {"topping_name": "Thêm phô mai Mozzarella", "extra": Decimal("25000")}
        ]
    },
    {
        "name": "Bánh Mì Bơ Tỏi Phô Mai (Khai vị)",
        "description": "Bánh mì Baguette nướng giòn tan phủ bơ tươi tỏi băm thơm lừng và phô mai Mozzarella chảy tràn béo ngậy.",
        "price": Decimal("40000"),
        "image_url": "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800&auto=format&fit=crop&q=80",
        "category": "Món Phụ",
        "ingredients": ["Bánh mì Baguette", "Bơ nhạt", "Tỏi băm", "Phô mai Mozzarella"],
        "sizes": [
            {"size_name": "Suất 4 miếng", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Suất 8 miếng", "mult": Decimal("1.00"), "extra": Decimal("35000")}
        ],
        "toppings": [
            {"topping_name": "Thêm sốt bơ tỏi", "extra": Decimal("8000")}
        ]
    }
]

async def seed_data():
    print("🚀 Bắt đầu tiến trình Seeding dữ liệu thực đơn Ngày 10 (10 Món Cao Cấp)...")
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Step 1: Ensure Categories
        print("\n📂 1. Đồng bộ Danh mục (Categories)...")
        cat_map = {}
        for cdata in CATEGORIES_DATA:
            res = await db.execute(select(Category).where(Category.name == cdata["name"]))
            cat = res.scalars().first()
            if not cat:
                cat = Category(name=cdata["name"], description=cdata["description"], icon=cdata["icon"])
                db.add(cat)
                await db.flush()
                print(f"   + Đã tạo danh mục: {cat.name}")
            else:
                cat.description = cdata["description"]
                cat.icon = cdata["icon"]
                print(f"   ✔ Đã có danh mục: {cat.name}")
            cat_map[cat.name] = cat.id

        # Step 2: Ensure Master Ingredients
        print("\n🥦 2. Đồng bộ Từ điển Nguyên liệu gốc (Master Ingredients)...")
        ing_map = {}
        for ing_name in INGREDIENTS_DATA:
            res = await db.execute(select(Ingredient).where(Ingredient.name == ing_name))
            ing = res.scalars().first()
            if not ing:
                ing = Ingredient(name=ing_name)
                db.add(ing)
                await db.flush()
            ing_map[ing_name] = ing.id
        print(f"   ✔ Đã đồng bộ {len(ing_map)} nguyên liệu gốc trong hệ thống.")

        # Step 3: Ensure Master Sizes
        print("\n📏 3. Đồng bộ Từ điển Kích cỡ gốc (Master Sizes)...")
        for sdata in SIZES_DATA:
            res = await db.execute(select(Size).where(Size.name == sdata["name"]))
            sz = res.scalars().first()
            if not sz:
                sz = Size(name=sdata["name"], default_price_multiplier=sdata["mult"], default_extra_price=sdata["extra"])
                db.add(sz)
                await db.flush()
            else:
                sz.default_price_multiplier = sdata["mult"]
                sz.default_extra_price = sdata["extra"]
        print(f"   ✔ Đã chuẩn hóa {len(SIZES_DATA)} kích cỡ gốc.")

        # Step 4: Ensure Master Toppings
        print("\n🧀 4. Đồng bộ Từ điển Toppings bán kèm (Master Toppings)...")
        for tdata in TOPPINGS_DATA:
            res = await db.execute(select(Topping).where(Topping.name == tdata["name"]))
            tp = res.scalars().first()
            if not tp:
                tp = Topping(name=tdata["name"], default_extra_price=tdata["extra"])
                db.add(tp)
                await db.flush()
            else:
                tp.default_extra_price = tdata["extra"]
        print(f"   ✔ Đã chuẩn hóa {len(TOPPINGS_DATA)} topping gốc.")

        # Step 5: Clean old test products to ensure pristine 10 menu items
        print("\n🧹 5. Dọn dẹp dữ liệu sản phẩm test cũ để đảm bảo thực đơn 10 món chuẩn...")
        await db.execute(text("DELETE FROM product_sizes"))
        await db.execute(text("DELETE FROM product_toppings"))
        await db.execute(text("DELETE FROM product_ingredients"))
        await db.execute(text("DELETE FROM products"))
        await db.flush()
        print("   ✔ Đã làm sạch bảng products và các bảng phụ thuộc.")

        # Step 6: Insert 10 Curated Products
        print("\n🍕 6. Thêm 10 Sản phẩm Thực đơn mẫu cùng trọn bộ thuộc tính 2 lớp...")
        for pdata in PRODUCTS_DATA:
            cat_id = cat_map.get(pdata["category"])
            prod = Product(
                name=pdata["name"],
                description=pdata["description"],
                price=pdata["price"],
                image_url=pdata["image_url"],
                category_id=cat_id,
                is_available=True
            )
            db.add(prod)
            await db.flush()

            # Add ingredient associations
            for ing_name in pdata.get("ingredients", []):
                ing_id = ing_map.get(ing_name)
                if ing_id:
                    db.add(ProductIngredient(product_id=prod.id, ingredient_id=ing_id))

            # Add size associations
            for sz in pdata.get("sizes", []):
                db.add(ProductSize(
                    product_id=prod.id,
                    size_name=sz["size_name"],
                    price_multiplier=sz["mult"],
                    extra_price=sz["extra"]
                ))

            # Add topping associations
            for tp in pdata.get("toppings", []):
                db.add(ProductTopping(
                    product_id=prod.id,
                    topping_name=tp["topping_name"],
                    extra_price=tp["extra"]
                ))

            print(f"   🎉 [+ID: {prod.id:2d}] {prod.name} | Giá: {prod.price:,.0f} đ | {len(pdata['sizes'])} Sizes | {len(pdata['toppings'])} Toppings")

        await db.commit()
        print("\n✅ [THÀNH CÔNG] Toàn bộ 10 món ăn, danh mục và từ điển thuộc tính đã được lưu trữ an toàn vào DB!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_data())
