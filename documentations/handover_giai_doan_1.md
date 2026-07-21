# TÀI LIỆU BÀN GIAO GIAI ĐOẠN 1 -> GIAI ĐOẠN 2
**Dự án:** Pizza Store Full-Stack System  
**Thời gian hoàn thành:** Giai đoạn 1 (Ngày 1 đến Ngày 5)  
**Mục tiêu tiếp theo:** Giai đoạn 2 - Admin Lõi & Dữ liệu (Ngày 6 đến Ngày 10)

---

## 🌟 PHẦN I: TỔNG KẾT THÀNH QUẢ GIAI ĐOẠN 1 (NGÀY 1 -> NGÀY 5)
Trong **Giai đoạn 1**, chúng ta đã xây dựng thành công nền tảng kiến trúc Core (Backend FastAPI + Frontend React Vite + CSDL Neon PostgreSQL) chạy hoàn toàn ổn định và hoàn thiện 100% cụm tính năng Khởi tạo, Xác thực, và Hồ sơ khách hàng / Sổ địa chỉ.

### 1. Kiến trúc & Cơ sở dữ liệu (Ngày 1 & 2)
- **Cơ sở dữ liệu Neon PostgreSQL**: Đã chạy `schema.sql` khởi tạo đầy đủ các bảng chính (`users`, `user_addresses`, `categories`, `products`, `orders`, `cart_items`,...).
- **Backend Base (`backend/`)**:
  - FastAPI cấu trúc chuẩn Async SQLAlchemy (`app/core/database.py`, `app/core/config.py`, `app/core/security.py`).
  - CORS Middleware cấu trúc mở rộng, sẵn sàng kết nối với Frontend (`http://localhost:5173`).
- **Frontend Base (`web-frontend/`)**:
  - React 19 + Vite kết hợp Tailwind CSS v4.
  - HTTP Client `src/api/axiosInstance.js`: Tự động gắn header `Authorization: Bearer <token>` và xử lý global interceptor (tự động điều hướng `/login` khi token hết hạn `401 Unauthorized`).

### 2. Xác thực & Phân quyền Auth (Ngày 3 & 4)
- **Backend Auth (`/api/auth`)**:
  - `POST /api/auth/register`: Đăng ký tài khoản (mật khẩu được mã hóa an toàn bằng `passlib.bcrypt`).
  - `POST /api/auth/login`: Xác thực và cấp phát `JWT access_token`.
  - `POST /api/auth/logout`: Đăng xuất.
  - Dependency `get_current_user` trong `app/core/deps.py`: Giải mã JWT Token và bảo vệ các private endpoint.
- **Frontend Auth UI & Logic**:
  - `AuthContext.jsx` & `useAuth.js`: Quản lý state đăng nhập toàn cục, duy trì phiên (persist session) qua `localStorage`.
  - Trang `Login.jsx` & `Register.jsx`: Thiết kế split-screen hiện đại, responsive hoàn hảo trên mọi thiết bị.
  - `Navbar.jsx`: Hiển thị lời chào động `"Xin chào, {user.full_name}"`, huy hiệu `Admin` (nếu role là admin) và nút Đăng xuất.

### 3. Hồ sơ cá nhân & Sổ địa chỉ Khách hàng (Ngày 5)
- **Quy hoạch kiến trúc Frontend (`src/pages/`)**:
  - Phân vùng rõ ràng theo vai trò: `auth/` (Login, Register), `shop/` (Home), `customer/` (Profile, AddressBook), chuẩn bị sẵn sàng cho `admin/`.
- **Backend Users & Addresses (`/api/users`)**:
  - `GET/PUT /api/users/me`: Xem và cập nhật họ tên người dùng.
  - `GET/POST/PUT/DELETE /api/users/me/addresses`: CRUD Sổ địa chỉ giao hàng.
  - `PUT /api/users/me/addresses/{id}/default`: Đặt làm địa chỉ mặc định.
  - *Logic thông minh*: Địa chỉ đầu tiên tự động gán mặc định; khi đặt mặc định địa chỉ mới, hệ thống tự reset các địa chỉ khác; khi xóa địa chỉ mặc định, tự động chuyển mặc định sang địa chỉ mới nhất còn lại.
- **Frontend Customer UI**:
  - `Profile.jsx`: Trang quản lý hồ sơ cá nhân với sidebar/tab chuyển đổi mượt mà giữa `"👤 Thông tin tài khoản"` và `"📍 Sổ địa chỉ"`.
  - `AddressBook.jsx`: Hiển thị danh sách thẻ (Card) với viền đỏ nổi bật và huy hiệu `[Mặc định]`, tích hợp Modal thêm/sửa địa chỉ đầy đủ các trường (Họ tên, SĐT, Tỉnh/Thành, Quận/Huyện, Phường/Xã, Số nhà).
- **Kiểm thử E2E**: Đã chạy kiểm thử tự động toàn diện trên trình duyệt thực với kết quả đạt chuẩn 100%.

---

## 📂 PHẦN II: CẤU TRÚC CODE HIỆN TẠI (ĐỂ AI TIẾP THEO NẮM BẮT)

```text
D:\Project\Pizza-Store\
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # Router: /api/auth/*
│   │   │   └── users.py         # Router: /api/users/* (Profile & Addresses CRUD)
│   │   ├── core/
│   │   │   ├── config.py        # Settings (.env variables)
│   │   │   ├── database.py      # AsyncSessionLocal & Base
│   │   │   ├── deps.py          # get_db, get_current_user dependency
│   │   │   └── security.py      # passlib bcrypt & jose JWT utilities
│   │   ├── models/
│   │   │   ├── user.py          # Table: users
│   │   │   └── user_address.py  # Table: user_addresses
│   │   ├── schemas/
│   │   │   ├── user.py          # UserRegister, UserLogin, UserData, TokenResponse
│   │   │   └── user_address.py  # AddressCreate, AddressUpdate, AddressResponse, ProfileUpdate
│   │   └── main.py              # FastAPI app registration & CORS middleware
│   └── requirements.txt
│
└── web-frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axiosInstance.js # Base Axios với JWT interceptor & 401 handler
    │   │   ├── authAPI.js       # Gọi các endpoints /auth/*
    │   │   └── userAPI.js       # Gọi các endpoints /users/*
    │   ├── components/
    │   │   └── common/
    │   │       └── Navbar.jsx   # Top Navigation bar (nhận diện auth & role)
    │   ├── contexts/
    │   │   └── AuthContext.jsx  # Context cung cấp { user, isAuthenticated, login, logout }
    │   ├── hooks/
    │   │   └── useAuth.js       # Custom hook consume AuthContext
    │   └── pages/
    │       ├── auth/
    │       │   ├── Login.jsx
    │       │   └── Register.jsx
    │       ├── customer/
    │       │   ├── Profile.jsx
    │       │   └── AddressBook.jsx
    │       └── shop/
    │           └── Home.jsx
    └── package.json
```

---

## 🎯 PHẦN III: KẾ HOẠCH & BÀN GIAO CÔNG VIỆC CHO GIAI ĐOẠN 2 (NGÀY 6 -> NGÀY 10)

**Mục tiêu chính của Giai đoạn 2:** Xây dựng hệ thống **Admin Portal (Quản trị viên)** cho phép quản lý Danh mục (Categories), Sản phẩm (Products), Kích thước (Sizes) và Toppings, sau đó nhập liệu 10 sản phẩm mẫu hoàn chỉnh.

### 📋 Chi tiết các task theo từng ngày cho Giai đoạn 2:

#### 1. Ngày 6: Backend API Products & Categories
- **Mục tiêu**: Code API CRUD cho Danh mục và Sản phẩm trên Backend.
- **Yêu cầu kỹ thuật**:
  - Tạo model `Category` (`categories` table) và `Product` (`products` table) trong `backend/app/models/`. Lưu ý trường `ingredients` trong bảng `products` là mảng chữ (`TEXT[]` hoặc `ARRAY(String)` / JSON).
  - Tạo Pydantic Schemas tương ứng (`CategoryCreate`, `CategoryResponse`, `ProductCreate`, `ProductUpdate`, `ProductResponse`) trong `backend/app/schemas/`.
  - Tạo dependency kiểm tra quyền Admin: `get_current_admin_user` trong `deps.py` (nếu `user.role != 'admin'` thì raise `HTTPException 403 Forbidden`).
  - Xây dựng router `api/categories.py` và `api/products.py` (CRUD có phân quyền admin, riêng `GET /api/products` và `GET /api/categories` cho phép public).
  - Đăng ký routers vào `main.py`.

#### 2. Ngày 7: Web Admin Layout & Protected Routes
- **Mục tiêu**: Tạo khung giao diện dành riêng cho Admin và bảo vệ các đường dẫn `/admin/*`.
- **Yêu cầu kỹ thuật**:
  - Tạo component bảo vệ route `src/components/common/AdminRoute.jsx`: kiểm tra `isAuthenticated && user?.role === 'admin'`. Nếu không đủ quyền, chuyển hướng về `/` hoặc hiển thị trang `403 Access Denied`.
  - Dựng khung `src/layouts/AdminLayout.jsx` (hoặc `src/components/admin/AdminLayout.jsx`):
    - **Sidebar bên trái**: Chứa menu điều hướng chuyên nghiệp (Dashboard, Danh mục, Sản phẩm, Topping & Size, Đơn hàng, Voucher, Khách hàng).
    - **Top Bar**: Hiển thị tên Admin, thông báo và nút quay về trang Khách hàng (`/`).
  - Cập nhật `App.jsx` để bọc các route `/admin/*` bên trong `AdminRoute` + `AdminLayout`.

#### 3. Ngày 8: Web Product Management & ProductForm
- **Mục tiêu**: Xây dựng giao diện quản lý danh sách sản phẩm và form Thêm/Sửa sản phẩm.
- **Yêu cầu kỹ thuật**:
  - Tạo API client `src/api/adminAPI.js` (hoặc `productAPI.js` & `categoryAPI.js`).
  - Tạo trang `src/pages/admin/ProductManagement.jsx`:
    - Bảng danh sách sản phẩm (tên, danh mục, hình ảnh thu nhỏ, giá cơ bản, trạng thái đang bán/hết hàng).
    - Bộ lọc theo danh mục, ô tìm kiếm và nút "+ Thêm sản phẩm mới".
  - Tạo component `src/pages/admin/ProductForm.jsx` (Dạng Modal hoặc trang riêng):
    - Form nhập liệu đầy đủ: Tên bánh, Danh mục (dropdown từ API), Giá bán, Mô tả chi tiết, Đường dẫn hình ảnh (`image_url`), và **Danh sách nguyên liệu (Ingredients)** (cho phép thêm/xóa từng tag nguyên liệu như `Phô mai Mozzarella`, `Sốt cà chua`, `Pepperoni`...).

#### 4. Ngày 9: Toppings & Sizes Management
- **Mục tiêu**: Quản lý Kích thước bánh (Size S, M, L) và Topping bổ sung.
- **Yêu cầu kỹ thuật**:
  - Mở rộng Model & API cho `product_sizes` (hoặc bảng giá theo size) và `toppings` (tên topping, giá tiền).
  - Tạo giao diện quản lý `src/pages/admin/ToppingManagement.jsx` và thiết lập cấu hình giá Size cho từng bánh pizza trên Admin Portal.

#### 5. Ngày 10: Data Entry (Nhập liệu mẫu thực tế)
- **Mục tiêu**: Sử dụng chính giao diện Admin đã xây dựng ở Ngày 7-9 để nhập liệu **10 sản phẩm Pizza mẫu** với dữ liệu phong phú, sống động.
- **Yêu cầu kỹ thuật**:
  - Nhập ít nhất 3-4 danh mục (VD: `Pizza Truyền Thống`, `Pizza Hải Sản & Cao Cấp`, `Pizza Chay`, `Đồ Uống / Món Khai Vị`).
  - Nhập 10 món Pizza với ảnh chất lượng cao (sử dụng link ảnh tĩnh chất lượng cao từ Unsplash/Freepik hoặc CDN), mô tả hấp dẫn, mảng `ingredients` rõ ràng, và các size (S, M, L) cùng các loại topping đi kèm.
  - Chuẩn bị sẵn sàng cho Giai đoạn 3 (Customer Web Core - Khách hàng xem Menu và Đặt bánh).

---

## 📌 HƯỚNG DẪN KHỞI ĐỘNG NHANH CHO PHIÊN CHAT TIẾP THEO

Khi bắt đầu phiên chat mới, bạn (hoặc AI tiếp theo) thực hiện tuần tự các bước sau để khởi động môi trường và bắt tay vào **Ngày 6**:

1. **Kiểm tra trạng thái hệ thống và cổng database**:
   ```powershell
   # Khởi động Backend (FastAPI)
   cd d:\Project\Pizza-Store\backend
   .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   
   # Khởi động Frontend (React Vite)
   cd d:\Project\Pizza-Store\web-frontend
   npm.cmd run dev -- --port 5173
   ```
2. **Sử dụng tài khoản Admin mẫu để test**:
   - Nếu trong CSDL chưa có tài khoản với `role = 'admin'`, hãy tạo 1 tài khoản (VD: `admin@pizzastore.com` / pass: `123456`) thông qua API `/register`, sau đó cập nhật trực tiếp `role = 'admin'` trong bảng `users` bằng câu lệnh SQL trên Neon hoặc script Python.
3. **Bắt đầu viết code Ngày 6**:
   - Mở file `documentations/plan.md` và `documentations/schema.md` để đối chiếu cấu trúc bảng `categories` và `products` trước khi tạo SQLAlchemy Model ở `backend/app/models/`.
