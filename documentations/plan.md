### **Giai đoạn 1: Khởi tạo & Xác thực (Ngày 1 \- Ngày 5\)**

*Mục tiêu: Base project chạy ổn định, User đăng nhập thành công trên Web.*

| Ngày | Trọng tâm | Checklist chi tiết|
| :---- | :---- | :---- |
| **Ngày 1** | Database & Base Backend | \- Tạo repo GitHub. \- Run schema.sql trên Neon PostgreSQL. \- Cấu hình FastAPI (.env, SQLAlchemy connection). \- Test API /ping trả về 200 OK. |
| **Ngày 2** | Base Web Frontend | \- Khởi tạo React Vite, cài TailwindCSS/MUI. \- Cấu hình Axios instance (base URL, interceptors). \- Tạo cấu trúc thư mục (pages, components, context). |
| **Ngày 3** | Backend Auth API | \- Code API /register (Hash password bằng passlib). \- Code API /login (Cấp JWT Token). \- Code dependency get\_current\_user trong FastAPI. |
| **Ngày 4** | Web Auth UI & Logic | \- Dựng form Login.jsx và Register.jsx. \- Tích hợp AuthContext.jsx lưu token vào localStorage. \- Test luồng đăng nhập thành công từ giao diện. |
| **Ngày 5** | Profile & Address | \- Code API CRUD Sổ địa chỉ (Backend). \- Dựng UI AddressBook.jsx cho Customer. \- Tích hợp gọi API thêm/xóa địa chỉ. |

### **Giai đoạn 2: Admin Lõi & Dữ liệu (Ngày 6 \- Ngày 10\)**

*Mục tiêu: Admin nhập liệu được sản phẩm thực tế.*

| :---- | :---- | :---- |
| **Ngày 6** | Backend API Products | \- Code API CRUD Categories. \- Code API CRUD Products (xử lý lưu mảng ingredients). |
| **Ngày 7** | Web Admin Layout | \- Dựng Sidebar, Navbar cho Admin panel. \- Cấu hình React Router bảo vệ route (chỉ role admin mới vào được). |
| **Ngày 8** | Web Product Form | \- Dựng giao diện bảng danh sách sản phẩm. \- Xây dựng form Thêm/Sửa sản phẩm (ProductForm.jsx). |
| **Ngày 9** | Toppings & Sizes | \- Mở rộng API và giao diện để gán Size (S,M,L) và Toppings cho từng sản phẩm. |
| **Ngày 10** | Data Entry | \- Dùng giao diện Admin vừa tạo để nhập 10 sản phẩm pizza mẫu (đầy đủ ảnh, giá, topping, nguyên liệu). |

### **Giai đoạn 3: Customer Web Core (Ngày 11 \- Ngày 15\)**

*Mục tiêu: Khách hàng xem sản phẩm và tương tác với giỏ hàng.*

| :---- | :---- | :---- |
| **Ngày 11** | API Public Products | \- Code API GET /products có phân trang, lọc theo danh mục, lọc theo giá. |
| **Ngày 12** | Web Home Page | \- Dựng giao diện Home.jsx. \- Gọi API render danh sách Product Card. |
| **Ngày 13** | Web Product Detail | \- Dựng ProductDetail.jsx. \- Xử lý state chọn Size, chọn nhiều Topping, tính lại giá tự động trên UI. |
| **Ngày 14** | Backend Cart API | \- Code API Thêm/Sửa/Xóa item trong giỏ hàng (lưu DB cart\_items). |
| **Ngày 15** | Web Cart Logic | \- Tích hợp CartContext.jsx. \- Dựng Cart.jsx, gọi API đồng bộ giỏ hàng với Backend. |

### **Giai đoạn 4: Thanh toán & Giao dịch (Ngày 16 \- Ngày 19\)**

*Mục tiêu: Hoàn tất luồng Checkout từ đầu đến cuối.*

| :---- | :---- | :---- |
| **Ngày 16** | Voucher Logic | \- Code API Validate và Áp dụng mã giảm giá. \- Tích hợp ô nhập mã voucher vào trang Cart. |
| **Ngày 17** | Checkout API | \- Code API POST /orders. Dùng SQLAlchemy Transaction để đảm bảo tính toàn vẹn (trừ voucher, tạo đơn, xóa giỏ hàng cùng lúc). |
| **Ngày 18** | Web Checkout UI | \- Dựng trang Checkout.jsx (chọn địa chỉ giao, tóm tắt đơn). \- Tích hợp nút Đặt hàng và xử lý điều hướng khi thành công. |
| **Ngày 19** | Order Management | \- Web Customer: Dựng OrderHistory.jsx. \- Web Admin: Cập nhật giao diện để thay đổi status đơn hàng (Pending \-\> Completed). |

### **Giai đoạn 5: Tích hợp Chatbot AI (Ngày 20 \- Ngày 22\)**

*Mục tiêu: Entity Extraction bằng Gemini chạy mượt mà.*

| :---- | :---- | :---- |
| **Ngày 20** | Cấu hình Gemini | \- Lên schema Pydantic (Intent, Filters). \- Test Prompt Engineering với Gemini qua file python script độc lập. |
| **Ngày 21** | Chatbot API | \- Xây dựng endpoint /api/v1/chat. \- Hứng JSON từ Gemini \-\> Build query SQLAlchemy động \-\> Trả về cấu trúc JSON cho FE. |
| **Ngày 22** | Web Chat UI | \- Dựng ChatbotWidget.jsx dạng bong bóng góc phải màn hình. \- Tích hợp gọi API, render Text và Product Cards ngay trong cửa sổ chat. |

### **Giai đoạn 6: Mobile Client (Ngày 23 \- Ngày 27\)**

*Mục tiêu: Đưa các luồng đã hoàn thiện lên Android bằng Jetpack Compose.*

| :---- | :---- | :---- |
| **Ngày 23** | Base Android | \- Setup Retrofit, ViewModel. \- Code LoginScreen và logic lưu token. |
| **Ngày 24** | Android Home | \- Dựng NavGraph. \- Code HomeScreen, load danh sách sản phẩm bằng Coil (hiển thị ảnh). |
| **Ngày 25** | Android Detail | \- Code ProductDetailScreen. Tái sử dụng chính API đã viết cho Web. Xử lý logic chọn topping trên Mobile. |
| **Ngày 26** | Android Checkout | \- Code CartScreen và CheckoutScreen. Luồng đi thẳng vào API thanh toán. |
| **Ngày 27** | Android Chatbot | \- Tích hợp UI Chat trên Mobile. Tái sử dụng API /api/v1/chat. |

### **Giai đoạn 7: QA & Hoàn thiện (Ngày 28 \- Ngày 30\)**

*Mục tiêu: Sẵn sàng đóng gói dự án.*

| :---- | :---- | :---- |
| **Ngày 28** | Bug Fixing (E2E) | \- Đóng vai User đi luồng thực tế trên Web và App. \- Đóng vai AI (prompt đủ mọi kiểu) để tìm lỗi crash Backend. |
| **Ngày 29** | UI/UX Polish | \- Xử lý các trạng thái Loading (Spinner), Error (Toast) cho cả 2 nền tảng để tăng tính chuyên nghiệp. |
| **Ngày 30** | Documentation | \- Viết OpenAPI/Swagger docs. \- Chốt file README.md hướng dẫn run project bằng tiếng Anh. \- Đóng tag release trên GitHub. |

