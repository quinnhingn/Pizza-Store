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

# 2. Master Sizes (Reused)
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
    {"name": "Ly vừa (M)", "mult": Decimal("1.00"), "extra": Decimal("0")},
    {"name": "Ly lớn (L)", "mult": Decimal("1.00"), "extra": Decimal("10000")},
    {"name": "Lon 320ml", "mult": Decimal("1.00"), "extra": Decimal("0")},
]

# 3. Master Toppings (Reused and expanded)
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
    {"name": "Thêm trân châu trắng", "extra": Decimal("10000")},
    {"name": "Thêm đào ngâm", "extra": Decimal("12000")},
    {"name": "Thêm sốt phô mai béo", "extra": Decimal("15000")},
]

# 4. Master Ingredients (All unique ingredients for the new products)
INGREDIENTS_DATA = [
    "Thịt gà nướng", "Dứa nhiệt đới", "Thịt nguội", "Nấm Truffle đen", "Phô mai Mozzarella", 
    "Xúc xích Đức", "Sốt cà chua Ý", "Đùi gà tẩm bột", "Khoai tây", "Bột phô mai", 
    "Mực ống", "Trà đen", "Đào ngâm", "Sả", "Cam vàng", "Trà Oolong", "Vải ngâm", 
    "Hoa hồng", "Nước khoáng có ga", "Chanh dây", "Đường mía", "Thịt xông khói", 
    "Sốt kem Carbonara", "Lòng đỏ trứng", "Ớt hiểm", "Thịt bò băm"
]

# 5. 15 New Products
PRODUCTS_DATA = [
    {
        "name": "Pizza Hawaii Nhiệt Đới",
        "description": "Sự kết hợp hoàn hảo giữa thịt nguội đậm đà và dứa tươi chua ngọt trên nền phô mai béo ngậy.",
        "price": Decimal("165000"),
        "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Thịt nguội", "Dứa nhiệt đới", "Phô mai Mozzarella", "Sốt cà chua Ý"],
        "sizes": [
            {"size_name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.35"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Viền phô mai", "extra": Decimal("35000")},
            {"topping_name": "Thêm phô mai Mozzarella", "extra": Decimal("25000")}
        ]
    },
    {
        "name": "Pizza Gà Nướng Mật Ong",
        "description": "Thịt gà nướng thơm lừng kết hợp cùng sốt mật ong ngọt ngào, tạo nên hương vị đặc biệt khó cưỡng.",
        "price": Decimal("175000"),
        "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Thịt gà nướng", "Phô mai Mozzarella", "Sốt cà chua Ý"],
        "sizes": [
            {"size_name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.35"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Viền xúc xích", "extra": Decimal("30000")}
        ]
    },
    {
        "name": "Pizza Nấm Truffle Đen Hoàng Gia",
        "description": "Pizza thượng hạng với nấm Truffle đen thơm lừng, kết hợp với các loại phô mai nhập khẩu.",
        "price": Decimal("249000"),
        "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Nấm Truffle đen", "Phô mai Mozzarella"],
        "sizes": [
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.35"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Thêm phô mai Parmesan", "extra": Decimal("15000")}
        ]
    },
    {
        "name": "Pizza Xúc Xích Đức Thượng Hạng",
        "description": "Xúc xích Đức xông khói đậm đà, thái lát mỏng trải đều trên nền vỏ bánh nướng củi.",
        "price": Decimal("185000"),
        "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80",
        "category": "Pizza",
        "ingredients": ["Xúc xích Đức", "Phô mai Mozzarella", "Sốt cà chua Ý"],
        "sizes": [
            {"size_name": "Size S", "mult": Decimal("0.80"), "extra": Decimal("0")},
            {"size_name": "Size M", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Size L", "mult": Decimal("1.35"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Viền phô mai", "extra": Decimal("35000")}
        ]
    },
    {
        "name": "Gà Rán Giòn Nguyên Bản",
        "description": "Đùi gà tẩm bột chiên giòn theo công thức Mỹ, bên ngoài giòn tan, bên trong mọng nước.",
        "price": Decimal("40000"),
        "image_url": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
        "category": "Gà Rán",
        "ingredients": ["Đùi gà tẩm bột"],
        "sizes": [
            {"size_name": "1 Miếng", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Combo 3 Miếng", "mult": Decimal("1.00"), "extra": Decimal("75000")},
            {"size_name": "Combo 6 Miếng", "mult": Decimal("1.00"), "extra": Decimal("180000")}
        ],
        "toppings": [
            {"topping_name": "Sốt tỏi mật ong", "extra": Decimal("10000")}
        ]
    },
    {
        "name": "Gà Rán Phủ Sốt Phô Mai",
        "description": "Gà rán giòn rụm được phủ một lớp sốt phô mai Cheddar béo ngậy, dành cho tín đồ mê phô mai.",
        "price": Decimal("48000"),
        "image_url": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
        "category": "Gà Rán",
        "ingredients": ["Đùi gà tẩm bột", "Bột phô mai"],
        "sizes": [
            {"size_name": "1 Miếng", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Combo 3 Miếng", "mult": Decimal("1.00"), "extra": Decimal("75000")}
        ],
        "toppings": []
    },
    {
        "name": "Mì Ý Sốt Kem Carbonara",
        "description": "Mì Ý chuẩn vị với sốt kem Carbonara béo ngậy, thịt xông khói giòn rụm và lòng đỏ trứng.",
        "price": Decimal("95000"),
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3d5d6281298?w=800&auto=format&fit=crop&q=80",
        "category": "Mì Ý",
        "ingredients": ["Sốt kem Carbonara", "Thịt xông khói", "Lòng đỏ trứng", "Phô mai Parmesan"],
        "sizes": [
            {"size_name": "Suất tiêu chuẩn", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Suất lớn", "mult": Decimal("1.00"), "extra": Decimal("30000")}
        ],
        "toppings": [
            {"topping_name": "Thêm phô mai Parmesan", "extra": Decimal("15000")}
        ]
    },
    {
        "name": "Mì Ý Bò Băm Cay Sốt Arrabbiata",
        "description": "Mì Ý thịt bò băm kết hợp cùng nước sốt cà chua Arrabbiata cay nồng kích thích vị giác.",
        "price": Decimal("89000"),
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3d5d6281298?w=800&auto=format&fit=crop&q=80",
        "category": "Mì Ý",
        "ingredients": ["Thịt bò băm", "Sốt cà chua Ý", "Ớt hiểm"],
        "sizes": [
            {"size_name": "Suất tiêu chuẩn", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Suất lớn", "mult": Decimal("1.00"), "extra": Decimal("30000")}
        ],
        "toppings": [
            {"topping_name": "Thêm thịt bò băm", "extra": Decimal("25000")}
        ]
    },
    {
        "name": "Khoai Tây Chiên Lắc Phô Mai",
        "description": "Khoai tây chiên vàng giòn rụm được lắc cùng bột phô mai mằn mặn béo ngậy.",
        "price": Decimal("45000"),
        "image_url": "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800&auto=format&fit=crop&q=80",
        "category": "Món Phụ",
        "ingredients": ["Khoai tây", "Bột phô mai"],
        "sizes": [
            {"size_name": "Suất tiêu chuẩn", "mult": Decimal("1.00"), "extra": Decimal("0")}
        ],
        "toppings": [
            {"topping_name": "Thêm sốt phô mai béo", "extra": Decimal("15000")}
        ]
    },
    {
        "name": "Mực Vòng Tẩm Bột Chiên Giòn",
        "description": "Mực ống tươi cắt khoanh tròn, tẩm bột chiên vàng giòn, chấm cùng tương ớt chua ngọt.",
        "price": Decimal("65000"),
        "image_url": "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800&auto=format&fit=crop&q=80",
        "category": "Món Phụ",
        "ingredients": ["Mực ống"],
        "sizes": [
            {"size_name": "Suất tiêu chuẩn", "mult": Decimal("1.00"), "extra": Decimal("0")}
        ],
        "toppings": []
    },
    {
        "name": "Trà Đào Cam Sả",
        "description": "Đồ uống giải khát tuyệt vời với hương vị đào ngọt ngào, cam tươi và sả thanh mát.",
        "price": Decimal("45000"),
        "image_url": "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&auto=format&fit=crop&q=80",
        "category": "Đồ Uống",
        "ingredients": ["Trà đen", "Đào ngâm", "Sả", "Cam vàng"],
        "sizes": [
            {"size_name": "Ly vừa (M)", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Ly lớn (L)", "mult": Decimal("1.00"), "extra": Decimal("10000")}
        ],
        "toppings": [
            {"topping_name": "Thêm trân châu trắng", "extra": Decimal("10000")},
            {"topping_name": "Thêm đào ngâm", "extra": Decimal("12000")}
        ]
    },
    {
        "name": "Trà Oolong Vải Hoa Hồng",
        "description": "Trà Oolong thượng hạng ủ lạnh, kết hợp cùng vải ngâm và siro hoa hồng thanh lịch.",
        "price": Decimal("49000"),
        "image_url": "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&auto=format&fit=crop&q=80",
        "category": "Đồ Uống",
        "ingredients": ["Trà Oolong", "Vải ngâm", "Hoa hồng"],
        "sizes": [
            {"size_name": "Ly vừa (M)", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Ly lớn (L)", "mult": Decimal("1.00"), "extra": Decimal("10000")}
        ],
        "toppings": [
            {"topping_name": "Thêm trân châu trắng", "extra": Decimal("10000")}
        ]
    },
    {
        "name": "Soda Chanh Dây Tươi",
        "description": "Soda giải khát cực mạnh với nước cốt chanh dây tươi chua ngọt sảng khoái.",
        "price": Decimal("35000"),
        "image_url": "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&auto=format&fit=crop&q=80",
        "category": "Đồ Uống",
        "ingredients": ["Nước khoáng có ga", "Chanh dây", "Đường mía"],
        "sizes": [
            {"size_name": "Ly vừa (M)", "mult": Decimal("1.00"), "extra": Decimal("0")},
            {"size_name": "Ly lớn (L)", "mult": Decimal("1.00"), "extra": Decimal("10000")}
        ],
        "toppings": []
    },
    {
        "name": "Coca Cola Tươi",
        "description": "Lon Coca Cola mát lạnh giải nhiệt tức thì, ăn cùng Pizza là tuyệt nhất.",
        "price": Decimal("25000"),
        "image_url": "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&auto=format&fit=crop&q=80",
        "category": "Đồ Uống",
        "ingredients": [],
        "sizes": [
            {"size_name": "Lon 320ml", "mult": Decimal("1.00"), "extra": Decimal("0")}
        ],
        "toppings": []
    },
    {
        "name": "Pepsi Không Calo",
        "description": "Pepsi phiên bản không đường, không calo nhưng vẫn giữ nguyên hương vị sảng khoái.",
        "price": Decimal("25000"),
        "image_url": "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&auto=format&fit=crop&q=80",
        "category": "Đồ Uống",
        "ingredients": [],
        "sizes": [
            {"size_name": "Lon 320ml", "mult": Decimal("1.00"), "extra": Decimal("0")}
        ],
        "toppings": []
    }
]

async def seed_additional_data():
    print("🚀 Bắt đầu tiến trình Seeding 15 món ăn mới...")
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
                print(f"   ✔ Đã có danh mục: {cat.name}")
            cat_map[cat.name] = cat.id

        # Step 2: Ensure Master Ingredients
        print("\n🥦 2. Đồng bộ Nguyên liệu mới (Master Ingredients)...")
        ing_map = {}
        for ing_name in INGREDIENTS_DATA:
            res = await db.execute(select(Ingredient).where(Ingredient.name == ing_name))
            ing = res.scalars().first()
            if not ing:
                ing = Ingredient(name=ing_name)
                db.add(ing)
                await db.flush()
                print(f"   + Đã thêm nguyên liệu: {ing.name}")
            ing_map[ing_name] = ing.id
        print(f"   ✔ Đã đồng bộ nguyên liệu gốc.")

        # Step 3: Ensure Master Sizes
        print("\n📏 3. Đồng bộ Kích cỡ mới (Master Sizes)...")
        for sdata in SIZES_DATA:
            res = await db.execute(select(Size).where(Size.name == sdata["name"]))
            sz = res.scalars().first()
            if not sz:
                sz = Size(name=sdata["name"], default_price_multiplier=sdata["mult"], default_extra_price=sdata["extra"])
                db.add(sz)
                await db.flush()
                print(f"   + Đã thêm size: {sz.name}")
            else:
                sz.default_price_multiplier = sdata["mult"]
                sz.default_extra_price = sdata["extra"]
        print(f"   ✔ Đã chuẩn hóa kích cỡ gốc.")

        # Step 4: Ensure Master Toppings
        print("\n🧀 4. Đồng bộ Toppings mới (Master Toppings)...")
        for tdata in TOPPINGS_DATA:
            res = await db.execute(select(Topping).where(Topping.name == tdata["name"]))
            tp = res.scalars().first()
            if not tp:
                tp = Topping(name=tdata["name"], default_extra_price=tdata["extra"])
                db.add(tp)
                await db.flush()
                print(f"   + Đã thêm topping: {tp.name}")
            else:
                tp.default_extra_price = tdata["extra"]
        print(f"   ✔ Đã chuẩn hóa topping gốc.")

        # NO DELETION! We append.

        # Step 6: Insert 15 New Products
        print("\n🍕 6. Thêm 15 Sản phẩm Thực đơn mới (KHÔNG xóa dữ liệu cũ)...")
        for pdata in PRODUCTS_DATA:
            # Check if product exists to avoid duplicates
            res = await db.execute(select(Product).where(Product.name == pdata["name"]))
            existing_prod = res.scalars().first()
            if existing_prod:
                print(f"   ⚠ Sản phẩm '{pdata['name']}' đã tồn tại. Bỏ qua.")
                continue

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

            print(f"   🎉 [+ID: {prod.id:2d}] {prod.name} | Giá: {prod.price:,.0f} đ")

        await db.commit()
        print("\n✅ [THÀNH CÔNG] Đã thêm thành công các món ăn mới vào DB!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_additional_data())
