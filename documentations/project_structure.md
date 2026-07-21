  
pizza-store/  
│  
├── 📁 backend/                         \# Backend FastAPI (Python)  
│   ├── 📁 app/  
│   │   ├── 📁 api/                     \# Định nghĩa các route API  
│   │   │   │   ├── 📁 endpoints/  
│   │   │   │   │   ├── \_\_init\_\_.py  
│   │   │   │   │   ├── auth.py         \# Login, Register, Logout  
│   │   │   │   │   ├── users.py        \# Profile, Address management  
│   │   │   │   │   ├── products.py     \# Product list, detail  
│   │   │   │   │   ├── cart.py         \# Cart CRUD  
│   │   │   │   │   ├── orders.py       \# Checkout, order history  
│   │   │   │   │   ├── vouchers.py     \# Apply voucher  
│   │   │   │   │   ├── reviews.py      \# Write review  
│   │   │   │   │   ├── chat.py         \# Chatbot AI endpoint  
│   │   │   │   │   ├── banners.py      \# Public banners  
│   │   │   │   │   └── 📁 admin/       \# Admin-only endpoints  
│   │   │   │   │       ├── \_\_init\_\_.py  
│   │   │   │   │       ├── dashboard.py  
│   │   │   │   │       ├── products.py  
│   │   │   │   │       ├── orders.py  
│   │   │   │   │       ├── users.py  
│   │   │   │   │       ├── vouchers.py  
│   │   │   │   │       ├── reviews.py  
│   │   │   │   │       └── banners.py  
│   │   │   │   └── \_\_init\_\_.py  
│   │   │   └── \_\_init\_\_.py  
│   │   │  
│   │   ├── 📁 core/                    \# Core modules  
│   │   │   ├── \_\_init\_\_.py  
│   │   │   ├── config.py               \# Environment variables, settings  
│   │   │   ├── database.py             \# SQLAlchemy setup, engine  
│   │   │   ├── security.py             \# JWT, password hashing  
│   │   │   └── deps.py                 \# Dependencies (get\_current\_user, etc.)  
│   │   │  
│   │   ├── 📁 models/                  \# SQLAlchemy models (database tables)  
│   │   │   ├── \_\_init\_\_.py  
│   │   │   ├── user.py  
│   │   │   ├── user\_address.py  
│   │   │   ├── category.py  
│   │   │   ├── product.py  
│   │   │   ├── product\_topping.py  
│   │   │   ├── product\_size.py  
│   │   │   ├── order.py  
│   │   │   ├── order\_item.py  
│   │   │   ├── voucher.py  
│   │   │   ├── review.py  
│   │   │   ├── banner.py  
│   │   │   └── chat\_history.py         \# (Optional) Lưu lịch sử chat  
│   │   │  
│   │   ├── 📁 schemas/                 \# Pydantic schemas (request/response)  
│   │   │   ├── \_\_init\_\_.py  
│   │   │   ├── auth.py  
│   │   │   ├── user.py  
│   │   │   ├── product.py  
│   │   │   ├── cart.py  
│   │   │   ├── order.py  
│   │   │   ├── voucher.py  
│   │   │   ├── review.py  
│   │   │   └── chat.py  
│   │   │  
│   │   ├── 📁 services/                \# Business logic  
│   │   │   ├── \_\_init\_\_.py  
│   │   │   ├── auth\_service.py  
│   │   │   ├── product\_service.py  
│   │   │   ├── cart\_service.py  
│   │   │   ├── order\_service.py  
│   │   │   ├── voucher\_service.py  
│   │   │   ├── review\_service.py  
│   │   │   └── 📁 chat/                \# Chatbot logic  
│   │   │       ├── \_\_init\_\_.py  
│   │   │       ├── gemini\_client.py    \# Gọi Gemini API  
│   │   │       ├── prompt\_builder.py   \# Tạo prompt cho AI  
│   │   │       └── response\_parser.py  \# Parse response từ AI  
│   │   │  
│   │   ├── 📁 utils/                   \# Utility functions  
│   │   │   ├── \_\_init\_\_.py  
│   │   │   ├── helpers.py  
│   │   │   └── validators.py  
│   │   │  
│   │   └── main.py                     \# FastAPI app entry point  
│   │  
│   ├── 📁 alembic/                     \# (Optional) Database migrations  
│   │   └── versions/  
│   ├── 📁 tests/                       \# Unit tests  
│   │   ├── \_\_init\_\_.py  
│   │   ├── test\_auth.py  
│   │   ├── test\_products.py  
│   │   └── ...  
│   │  
│   ├── .env                            \# Environment variables  
│   ├── .gitignore  
│   ├── requirements.txt                \# Python dependencies  
│   └── README.md  
│  
├── 📁 web-frontend/                    \# React Frontend (JavaScript)  
│   ├── 📁 public/  
│   │   └── index.html  
│   ├── 📁 tests/  
│   ├── 📁 src/  
│   │   ├── 📁 api/                     \# API calls  
│   │   │   ├── axiosInstance.js        \# Axios config with interceptors  
│   │   │   ├── authAPI.js  
│   │   │   ├── productAPI.js  
│   │   │   ├── cartAPI.js  
│   │   │   ├── orderAPI.js  
│   │   │   ├── voucherAPI.js  
│   │   │   ├── reviewAPI.js  
│   │   │   ├── chatAPI.js  
│   │   │   └── adminAPI.js  
│   │   │  
│   │   ├── 📁 contexts/                \# React Context (state management)  
│   │   │   ├── AuthContext.jsx         \# User authentication state  
│   │   │   └── CartContext.jsx         \# Cart state (sync with API)  
│   │   │  
│   │   ├── 📁 hooks/                   \# Custom React hooks  
│   │   │   ├── useAuth.js  
│   │   │   ├── useCart.js  
│   │   │   └── useToast.js  
│   │   │  
│   │   ├── 📁 pages/                   \# Page components  
│   │   │   ├── Home.jsx  
│   │   │   ├── ProductDetail.jsx  
│   │   │   ├── Cart.jsx  
│   │   │   ├── Checkout.jsx  
│   │   │   ├── OrderHistory.jsx  
│   │   │   ├── OrderDetail.jsx  
│   │   │   ├── Profile.jsx  
│   │   │   ├── AddressBook.jsx  
│   │   │   ├── Login.jsx  
│   │   │   ├── Register.jsx  
│   │   │   └── 📁 admin/               \# Admin pages  
│   │   │       ├── Dashboard.jsx  
│   │   │       ├── ProductManagement.jsx  
│   │   │       ├── ProductForm.jsx  
│   │   │       ├── OrderManagement.jsx  
│   │   │       ├── CustomerManagement.jsx  
│   │   │       ├── VoucherManagement.jsx  
│   │   │       ├── ReviewManagement.jsx  
│   │   │       └── BannerManagement.jsx  
│   │   │  
│   │   ├── 📁 components/              \# Reusable components  
│   │   │   ├── 📁 common/  
│   │   │   │   ├── Navbar.jsx  
│   │   │   │   ├── Footer.jsx  
│   │   │   │   ├── LoadingSpinner.jsx  
│   │   │   │   ├── ToastNotification.jsx  
│   │   │   │   └── ProtectedRoute.jsx   \# Route guard for auth  
│   │   │   ├── 📁 product/  
│   │   │   │   ├── ProductCard.jsx  
│   │   │   │   ├── ProductFilter.jsx  
│   │   │   │   ├── ProductSizes.jsx  
│   │   │   │   └── ProductToppings.jsx  
│   │   │   ├── 📁 cart/  
│   │   │   │   └── CartItem.jsx  
│   │   │   ├── 📁 order/  
│   │   │   │   └── OrderCard.jsx  
│   │   │   ├── 📁 address/  
│   │   │   │   └── AddressCard.jsx  
│   │   │   └── 📁 chat/                \# Chatbot components  
│   │   │       ├── ChatbotWidget.jsx    \# Floating button \+ popup  
│   │   │       ├── ChatMessage.jsx      \# Message bubble  
│   │   │       ├── ChatProductCard.jsx  \# Product card inside chat  
│   │   │       └── QuickReplies.jsx     \# Quick reply chips  
│   │   │  
│   │   ├── 📁 styles/                  \# CSS styles  
│   │   │   ├── index.css  
│   │   │   └── admin.css  
│   │   │  
│   │   ├── 📁 utils/                   \# Utility functions  
│   │   │   ├── helpers.js  
│   │   │   ├── validators.js  
│   │   │   └── constants.js  
│   │   │  
│   │   ├── App.jsx                     \# Main App component with routes  
│   │   ├── main.jsx                    \# Entry point  
│   │   └── routes.js                   \# Route definitions  
│   │  
│   ├── .env                            \# Environment variables (API\_URL)  
│   ├── .gitignore  
│   ├── index.html  
│   ├── package.json  
│   ├── vite.config.js  
│   └── README.md  
│  
├── 📁 android-app/                     \# Android App (Kotlin \+ Compose)  
│   ├── 📁 app/  
│   │   ├── 📁 src/  
│   │   │   ├── 📁 main/  
│   │   │   │   ├── 📁 java/com/example/pizzaapp/  
│   │   │   │   │   ├── 📁 data/  
│   │   │   │   │   │   ├── 📁 models/          \# Data classes  
│   │   │   │   │   │   │   ├── User.kt  
│   │   │   │   │   │   │   ├── Product.kt  
│   │   │   │   │   │   │   ├── Cart.kt  
│   │   │   │   │   │   │   ├── Order.kt  
│   │   │   │   │   │   │   ├── Address.kt  
│   │   │   │   │   │   │   ├── Voucher.kt  
│   │   │   │   │   │   │   ├── Review.kt  
│   │   │   │   │   │   │   └── Chat.kt  
│   │   │   │   │   │   ├── 📁 network/        \# Retrofit & API interfaces  
│   │   │   │   │   │   │   ├── ApiService.kt  
│   │   │   │   │   │   │   ├── RetrofitInstance.kt  
│   │   │   │   │   │   │   └── ApiResponse.kt  
│   │   │   │   │   │   └── 📁 repository/     \# Repository pattern  
│   │   │   │   │   │       ├── AuthRepository.kt  
│   │   │   │   │   │       ├── ProductRepository.kt  
│   │   │   │   │   │       ├── CartRepository.kt  
│   │   │   │   │   │       ├── OrderRepository.kt  
│   │   │   │   │   │       └── ChatRepository.kt  
│   │   │   │   │   ├── 📁 ui/                 \# UI Screens (Compose)  
│   │   │   │   │   │   ├── 📁 screens/  
│   │   │   │   │   │   │   ├── HomeScreen.kt  
│   │   │   │   │   │   │   ├── ProductDetailScreen.kt  
│   │   │   │   │   │   │   ├── CartScreen.kt  
│   │   │   │   │   │   │   ├── CheckoutScreen.kt  
│   │   │   │   │   │   │   ├── OrderHistoryScreen.kt  
│   │   │   │   │   │   │   ├── OrderDetailScreen.kt  
│   │   │   │   │   │   │   ├── ProfileScreen.kt  
│   │   │   │   │   │   │   ├── AddressBookScreen.kt  
│   │   │   │   │   │   │   ├── LoginScreen.kt  
│   │   │   │   │   │   │   └── RegisterScreen.kt  
│   │   │   │   │   │   ├── 📁 components/    \# Reusable composables  
│   │   │   │   │   │   │   ├── ProductCard.kt  
│   │   │   │   │   │   │   ├── CartItem.kt  
│   │   │   │   │   │   │   ├── AddressCard.kt  
│   │   │   │   │   │   │   ├── ChatbotWidget.kt  
│   │   │   │   │   │   │   ├── ChatMessage.kt  
│   │   │   │   │   │   │   └── QuickReplyChip.kt  
│   │   │   │   │   │   ├── 📁 navigation/    \# NavHost & routes  
│   │   │   │   │   │   │   ├── NavGraph.kt  
│   │   │   │   │   │   │   └── Screen.kt  
│   │   │   │   │   │   └── 📁 theme/         \# Material3 theme  
│   │   │   │   │   │       ├── Color.kt  
│   │   │   │   │   │       └── Theme.kt  
│   │   │   │   │   ├── 📁 utils/             \# Utilities  
│   │   │   │   │   │   ├── Constants.kt  
│   │   │   │   │   │   ├── Helpers.kt  
│   │   │   │   │   │   └── TokenManager.kt   \# Lưu token trong SharedPreferences  
│   │   │   │   │   └── MainActivity.kt        \# Entry point  
│   │   │   │   └── 📁 res/                    \# Resources  
│   │   │   │       ├── drawable/  
│   │   │   │       ├── mipmap/  
│   │   │   │       └── values/  
│   │   │   └── 📁 androidTest/                \# Android tests  
│   │   ├── 📁 build.gradle (Module: app)  
│   │   └── 📁 proguard-rules.pro  
│   ├── 📁 gradle/  
│   ├── build.gradle (Project)  
│   ├── gradle.properties  
│   ├── gradlew  
│   ├── gradlew.bat  
│   ├── settings.gradle  
│   └── README.md  
│  
├── 📁 database/                         \# Database scripts  
│   ├── schema.sql                       \# Full database schema  
│   ├── seed.sql                         \# Sample data (pizza, toppings, etc.)  
│   └── migrations/                      \# (Optional) Migration scripts  
│  
├── 📁 docs/                             \# Project documentation  
│   ├── report/                          \# Đồ án báo cáo  
│   │   ├── report.docx  
│   │   └── report.pdf  
│   ├── slides/                          \# Slide thuyết trình  
│   │   └── presentation.pptx  
│   ├── API\_Design.md                    \# API documentation  
│   ├── Database\_Design.md               \# Database design doc  
│   └── User\_Manual.md                   \# Hướng dẫn sử dụng  
│  
├── 📁 postman/                          \# Postman collection for testing  
│   └── Pizza\_Chatbot\_API.postman\_collection.json  
│  
├── .gitignore                           \# Git ignore file  
├── README.md                            \# Project overview  
└── docker-compose.yml                   \# (Optional) Docker setup

## **📝 Giải thích nhanh về cấu trúc**

| Thư mục | Mô tả |
| :---- | :---- |
| `backend/` | Chứa toàn bộ source code Backend FastAPI. Tổ chức theo mô hình Route → Service → Model để dễ bảo trì. |
| `web-frontend/` | Chứa toàn bộ source code React. Tổ chức theo Pages → Components → API để tách biệt rõ ràng. |
| `android-app/` | Dự án Android Studio với kiến trúc MVVM (Model-View-ViewModel) thông qua Repository pattern. |
| `database/` | Chứa các script SQL để tạo bảng và seed dữ liệu mẫu trên Neon. |
| `docs/` | Tài liệu đồ án: báo cáo, slide, hướng dẫn sử dụng. |
| `postman/` | File JSON để import vào Postman, giúp test API nhanh. |
| `docker-compose.yml` | (Tùy chọn) Nếu bạn muốn đóng gói toàn bộ hệ thống để demo. |

## **🚀 Hướng dẫn chạy dự án nhanh**

### **1\. Backend**

`bash`

`cd backend`  
`python -m venv venv`  
`source venv/bin/activate  # Windows: venv\Scripts\activate`  
`pip install -r requirements.txt`

`uvicorn app.main:app --reload`

### **File `requirements.txt`**

fastapi==0.115.6  
uvicorn\[standard\]==0.34.0  
sqlalchemy==2.0.36  
asyncpg==0.30.0  
python-dotenv==1.0.1  
python-jose\[cryptography\]==3.3.0  
passlib\[bcrypt\]==1.7.4  
python-multipart==0.0.18  
google-generativeai==0.8.3

### **File `.env` (đặt trong thư mục `backend`)**

DATABASE\_URL=postgresql+asyncpg://user:password@ep-xxxx.neon.tech/dbname?sslmode=require  
SECRET\_KEY=your-secret-key-here  
ALGORITHM=HS256  
ACCESS\_TOKEN\_EXPIRE\_MINUTES=30  
GEMINI\_API\_KEY=your-gemini-api-key

###  **file `database.py` để kết nối Neon**

from sqlalchemy.ext.asyncio import create\_async\_engine, AsyncSession  
from sqlalchemy.orm import sessionmaker, declarative\_base  
import os  
from dotenv import load\_dotenv

load\_dotenv()

DATABASE\_URL \= os.getenv("DATABASE\_URL")  
engine \= create\_async\_engine(DATABASE\_URL, echo=True)  
AsyncSessionLocal \= sessionmaker(engine, class\_=AsyncSession, expire\_on\_commit=False)  
Base \= declarative\_base()

### **file `models.py` – định nghĩa các bảng** 

\# file models.py – định nghĩa các bảng  
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, ForeignKey, TIMESTAMP  
from sqlalchemy.sql import func  
from .database import Base

class Product(Base):  
    \_\_tablename\_\_ \= "products"  
    id \= Column(Integer, primary\_key=True, index=True)  
    name \= Column(String(200), nullable=False)  
    description \= Column(Text)  
    price \= Column(DECIMAL(10,2), nullable=False)  
    image\_url \= Column(String(500))  
    category\_id \= Column(Integer, ForeignKey("categories.id"))  
    is\_available \= Column(Boolean, default=True)  
    created\_at \= Column(TIMESTAMP, server\_default=func.now())  
    updated\_at \= Column(TIMESTAMP, server\_default=func.now(), onupdate=func.now())

### **`main.py` – khởi tạo FastAPI**

from fastapi import FastAPI  
from fastapi.middleware.cors import CORSMiddleware  
from .database import engine, Base  
from .routes import auth, products, orders, chat, admin

Base.metadata.create\_all(bind=engine)

app \= FastAPI(title="Pizza Chatbot API", version="1.0")

app.add\_middleware(  
    CORSMiddleware,  
    allow\_origins=\["http://localhost:5173", "http://localhost:3000"\],  \# React dev  
    allow\_credentials=True,  
    allow\_methods=\["\*"\],  
    allow\_headers=\["\*"\],  
)

app.include\_router(auth.router, prefix="/api/v1/auth", tags=\["auth"\])  
app.include\_router(products.router, prefix="/api/v1/products", tags=\["products"\])  
app.include\_router(orders.router, prefix="/api/v1/orders", tags=\["orders"\])  
app.include\_router(chat.router, prefix="/api/v1/chat", tags=\["chat"\])  
app.include\_router(admin.router, prefix="/api/v1/admin", tags=\["admin"\])

### **2\. Web Frontend**

`bash`

`cd web-frontend`  
`npm install`

`npm run dev`

### npm install react-router-dom axios bootstrap @mui/material @emotion/react @emotion/styled @mui/icons-material chart.js react-chartjs-2

### **3\. Android App**

`Cài đặt và cấu hình Android App (Kotlin + Jetpack Compose)`

`4.1. Tạo project mới trong Android Studio`

`Chọn template Empty Activity với Compose.`

`Đặt package: com.example.pizzaapp`

`4.2. Thêm dependencies trong build.gradle (Module: app)`

`dependencies {`

    `// Compose BOM`

    `implementation platform('androidx.compose:compose-bom:2024.11.00')`

    `implementation 'androidx.compose.ui:ui'`

    `implementation 'androidx.compose.material3:material3'`

    `implementation 'androidx.compose.ui:ui-tooling-preview'`

    `implementation 'androidx.lifecycle:lifecycle-runtime-compose:2.8.7'`

    `implementation 'androidx.activity:activity-compose:1.9.3'`

    `// Retrofit + Moshi`

    `implementation 'com.squareup.retrofit2:retrofit:2.11.0'`

    `implementation 'com.squareup.retrofit2:converter-moshi:2.11.0'`

    `implementation 'com.squareup.okhttp3:logging-interceptor:4.12.0'`

    `// Coroutines`

    `implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0'`

    `// Navigation`

    `implementation 'androidx.navigation:navigation-compose:2.8.0'`

    `// Coil (loading ảnh)`

    `implementation 'io.coil-kt.coil3:coil-compose:3.0.0-alpha06'`

`}`

`4.4. Tạo Retrofit client`

`// ApiService.kt`

`interface ApiService {`

    `@POST("auth/login")`

    `suspend fun login(@Body request: LoginRequest): Response<LoginResponse>`

    `// ... các API khác`

`}`

`// RetrofitInstance.kt`

`object RetrofitInstance {`

    `private const val BASE_URL = "http://10.0.2.2:8000/api/v1/"  // Dùng 10.0.2.2 cho emulator`

    `val api: ApiService by lazy {`

        `Retrofit.Builder()`

            `.baseUrl(BASE_URL)`

            `.addConverterFactory(MoshiConverterFactory.create())`

            `.build()`

            `.create(ApiService::class.java)`

    `}`

`}`

## **5\. Kết nối Neon Database**

* Truy cập [Neon Console](https://console.neon.tech/).  
* Tạo project mới, lấy Connection String dạng:  
* `text`  
* `postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require`  
* Copy vào `.env` của Backend (đã làm ở trên).  
* Chạy script tạo bảng (schema.sql) để tạo các bảng.

## **6\. Tóm tắt các cổng chạy**

| Thành phần | Cổng mặc định | Địa chỉ |
| :---- | :---- | :---- |
| Backend (FastAPI) | 8000 | [http://localhost:8000](http://localhost:8000/) |
| Web (React) | 5173 | [http://localhost:5173](http://localhost:5173/) |
| Android (emulator) | (tuỳ) | [http://10.0.2.2:8000](http://10.0.2.2:8000/) (kết nối đến backend) |

