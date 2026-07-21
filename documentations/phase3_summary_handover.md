# Tổng Kết Giai Đoạn 3 & Bàn Giao Công Việc Giai Đoạn 4 (Dự Án Pizza Store)

Tài liệu này tổng hợp toàn bộ các kết quả đạt được, kiến trúc kỹ thuật đã triển khai trong **Giai đoạn 3: Customer Web Core (Ngày 11 - Ngày 15)** và xác định lộ trình chi tiết cho **Giai đoạn 4: Thanh toán & Giao dịch (Ngày 16 - Ngày 19)** để bàn giao mượt mà cho phiên làm việc tiếp theo.

---

## I. TỔNG KẾT GIAI ĐOẠN 3: CUSTOMER WEB CORE (NGÀY 11 - NGÀY 15)

*Mục tiêu hoàn thành: Khách hàng (cả Guest chưa đăng nhập lẫn Customer đã đăng nhập) xem được thực đơn, tìm kiếm, lọc món, tùy chỉnh Size/Topping qua Modal, và tương tác đầy đủ với Giỏ hàng thông minh.*

### 1. Ngày 11: API Public Products (`backend/app/api/public_products.py`)
- **Endpoints chuyên biệt cho Khách hàng:** Xây dựng `GET /api/public/products` và `GET /api/public/products/{id}`.
- **Tính năng lọc & Tìm kiếm:** Hỗ trợ phân trang (`page`, `size`), lọc theo danh mục (`category_id`), khoảng giá (`min_price`, `max_price`), và tìm kiếm từ khóa (`search` theo `name`/`description`/`ingredients`).
- **Hiển thị đầy đủ thực đơn:** Trả về toàn bộ danh sách sản phẩm (bao gồm cả món đang bán `is_available=True` và món tạm ngưng `is_available=False`) để giao diện hiển thị huy hiệu `[ Hết món ]`.
- **Độ ổn định cao:** Bảo toàn tuyệt đối các API Admin cũ (`/api/products`), kiểm thử tự động `pytest tests/test_day11_api.py` đạt **PASSED 100%**.

### 2. Ngày 12: Web Home Page & Thực Đơn (`Home.jsx` & `ProductCard.jsx`)
- **Giao diện sang trọng (Artisan Italian Dining):** Hero banner gradient ấm áp, tiêu đề bắt mắt, thanh tìm kiếm thông minh (debounce 300ms) kèm nút xóa nhanh.
- **Thanh lọc nhanh:** Tabs danh mục cuộn ngang (`[ Tất cả ]`, `[ Pizza ]`,...) và bộ lọc theo mức giá nhanh (`Dưới 150k`, `150k - 250k`, `Trên 250k`).
- **Product Card (`ProductCard.jsx`) cao cấp:**
  - Hiển thị mô tả món ngắn gọn tối đa 2 dòng (`line-clamp-2`).
  - Hiển thị danh sách nguyên liệu chính bên dưới mô tả (`getIngredientName`).
  - Tag trạng thái rõ ràng: Món đang bán không hiển thị tag thừa, món tạm ngưng hiển thị `[ Hết món ]` màu tối xám, ảnh tự động làm mờ (`grayscale`).
  - Nút chọn món tối giản với icon dấu cộng (`Plus`).

### 3. Ngày 13: Product Detail Modal (`ProductDetailModal.jsx`)
- **Gỡ bỏ trang thừa:** Gỡ bỏ trang `ProductDetail.jsx` riêng lẻ theo yêu cầu, chuyển toàn bộ trải nghiệm chọn món sang dạng **Modal nhanh chóng ngay trên trang chủ**.
- **Tối ưu trải nghiệm chọn Topping & Size:**
  - Tự động chọn Size mặc định (`price_multiplier == 1.0`).
  - Danh sách chọn Topping hiển thị dạng dọc (`list-col`), rõ ràng trọn vẹn tên và giá cộng thêm.
  - Tự động tính lại tổng tiền ngay lập tức khi thay đổi số lượng/size/topping.
- **Thông báo Toast tinh tế:** Khi thêm món vào giỏ thành công, xuất hiện Toast màu xanh ngọc (`emerald-600`) với dòng chữ **"Đã thêm vào giỏ hàng"**.

### 4. Ngày 14: Backend Cart API & Smart Merging (`cart.py`)
- **Mô hình Dữ liệu (`cart_items` table):** Lưu `user_id`, `product_id`, `size_name`, `toppings` (kiểu `JSONB`), `quantity`, `note`, `unit_price`, `total_price`.
- **Kiến trúc phẳng (Flat Cart Architecture):** Bỏ qua sự phụ thuộc bảng trung gian `carts` cũ, gắn `user_id` trực tiếp vào `cart_items` giúp truy vấn tốc độ cao.
- **Thuật toán Gộp món thông minh (Smart Merging):**
  - Khi `POST /api/cart/items`, hệ thống tự động kiểm tra sự trùng lặp chính xác về `product_id + size_name + note + toppings` (không phân biệt thứ tự topping).
  - Nếu trùng: Tự động cộng dồn số lượng (`quantity += new_quantity`).
  - Nếu chưa có: Tạo dòng mới.
- **Đầy đủ CRUD:** Hỗ trợ `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`, `DELETE /api/cart/clear`. Kiểm thử `pytest tests/test_day14_cart_api.py` đạt **PASSED 100%**.

### 5. Ngày 15: Web Cart Logic & UI Tinh Giản (`CartContext.jsx` & `Cart.jsx`)
- **State Giỏ hàng & Đồng bộ tự động (`Auto-Sync`):**
  - Hỗ trợ **Khách vãng lai (Guest)** lưu trữ & gộp món offline tại `localStorage.guest_cart`.
  - Hỗ trợ **Khách hàng (`Customer`)** đồng bộ trực tiếp với Server API.
  - Ngay khi Guest đăng nhập, toàn bộ giỏ tạm trong `localStorage` tự động đẩy lên Server (`addItem`) và hòa vào giỏ hàng tài khoản mà không bị mất dữ liệu.
- **Thanh Điều hướng (`Navbar.jsx`):** Nút giỏ hàng chuyển thành dạng **icon-only button** gọn gàng kèm huy hiệu (`badge counter`) màu vàng nhấp nháy góc phải trên.
- **Trang Giỏ hàng tinh gọn, hiện đại (`Cart.jsx`):**
  - Số lượng món hiển thị dưới tiêu đề chính: **"Có .. sản phẩm trong giỏ hàng của bạn"**.
  - Không lạm dụng nhãn/tag màu sắc: Size, Topping và Ghi chú hiển thị dưới dạng **text xám nhạt (`text-gray-400/500`)** bên dưới tên món.
  - Tích hợp nút **"Chỉnh sửa"** ngay tại từng thẻ món: Bấm vào mở `ProductDetailModal` đã điền sẵn lựa chọn cũ, cho phép đổi Size/Topping/Số lượng liền mạch.
  - Khung nhập Mã ưu đãi và Tóm tắt đơn hàng (`Order Summary`) sạch đẹp, chuyên nghiệp, hiển thị tiến trình mua thêm để được miễn phí giao hàng (ngưỡng `200.000 ₫`).
- **Biên dịch hoàn hảo:** Chạy `npm run build` thành công, không có cảnh báo hay lỗi.

---

## II. BÀN GIAO CÔNG VIỆC CHO GIAI ĐOẠN 4: THANH TOÁN & GIAO DỊCH (NGÀY 16 - NGÀY 19)

*Mục tiêu của Giai đoạn 4: Hoàn tất luồng Checkout (đặt hàng) từ đầu đến cuối, đảm bảo tính toàn vẹn tài chính bằng Transaction và quản lý trạng thái đơn hàng.*

### 1. Ngày 16: Voucher Logic (API & UI integration)
- **Nhiệm vụ Backend:**
  - Viết endpoint `POST /api/vouchers/validate` (hoặc `GET /api/vouchers/check?code=...&order_value=...`).
  - Kiểm tra điều kiện áp dụng mã voucher: `is_active`, hạn sử dụng (`start_date <= now <= end_date`), giới hạn lượt dùng (`used_count < usage_limit`), và giá trị đơn hàng tối thiểu (`subtotal >= min_order_value`).
  - Tính số tiền được giảm (`discount_percent` hoặc `discount_amount`, tối đa không vượt quá `max_discount`).
- **Nhiệm vụ Frontend:**
  - Kết nối ô nhập mã voucher trong trang `Cart.jsx` với API validate thực tế thay vì giả lập giảm 30.000 ₫ như hiện tại.
  - Hiển thị thông báo lỗi rõ ràng nếu voucher hết hạn, không tồn tại hoặc chưa đủ điều kiện đơn hàng.

### 2. Ngày 17: Checkout API (Backend Order Creation with Transactions)
- **Nhiệm vụ Backend:**
  - Viết endpoint `POST /api/orders` xử lý tạo đơn hàng từ giỏ hàng hiện tại của người dùng.
  - **Sử dụng SQLAlchemy Transaction (`db.commit() / db.rollback()`)** đảm bảo tính nguyên tử (Atomicity):
    1. Kiểm tra lại giá sản phẩm & tính hợp lệ của giỏ hàng (`cart_items`).
    2. Nếu có `voucher_code`, kiểm tra lại điều kiện và tăng `used_count += 1`.
    3. Tạo bản ghi mới trong bảng `orders` (`order_code` duy nhất, `shipping_full_name`, `shipping_phone`, `shipping_address`, `total_amount`, `discount_amount`, `status = 'pending'`).
    4. Chuyển toàn bộ món từ `cart_items` sang `order_items` (**Snapshot cố định `unit_price`, `size_name`, `toppings` tại thời điểm đặt**).
    5. Xóa sạch giỏ hàng (`DELETE FROM cart_items WHERE user_id = :user_id`).
  - Viết bộ kiểm thử tự động `pytest tests/test_day17_orders_api.py -v`.

### 3. Ngày 18: Web Checkout UI (`Checkout.jsx`)
- **Nhiệm vụ Frontend:**
  - Tạo trang `web-frontend/src/pages/shop/Checkout.jsx` và thêm route `/checkout` vào `App.jsx`.
  - **Khu vực Sổ địa chỉ (`Address Selection`):** Cho phép Customer chọn địa chỉ giao hàng mặc định hoặc chọn từ danh sách `user_addresses` (đã làm ở Ngày 5) hoặc nhập địa chỉ mới ngay tại chỗ.
  - **Khu vực Tóm tắt thanh toán (`Order Review`):** Hiển thị danh sách món từ giỏ hàng, tạm tính, phí giao hàng, giảm giá voucher, tổng thanh toán và ô nhập Ghi chú giao hàng.
  - **Xử lý Đặt hàng:** Nút **[ Đặt hàng ngay ]** gửi payload lên `POST /api/orders`. Khi thành công, điều hướng sang trang `OrderSuccess.jsx` (hoặc hiển thị thông báo chúc mừng & dẫn về lịch sử đơn hàng).

### 4. Ngày 19: Order Management (Customer History & Admin Panel)
- **Nhiệm vụ Frontend Customer (`OrderHistory.jsx`):**
  - Tạo trang `OrderHistory.jsx` (Route `/orders` hoặc nằm trong khu vực `/profile`).
  - Gọi API `GET /api/orders/my-orders` để hiển thị danh sách đơn hàng đã đặt của khách kèm trạng thái (`pending`, `confirmed`, `shipping`, `completed`, `cancelled`) và chi tiết từng món (`order_items`).
- **Nhiệm vụ Web Admin (`OrdersManagement.jsx`):**
  - Tạo trang Quản lý Đơn hàng cho Admin (`/admin/orders`).
  - Hiển thị bảng danh sách toàn bộ đơn hàng trên hệ thống, có bộ lọc theo trạng thái.
  - Cho phép Admin thay đổi trạng thái đơn hàng (ví dụ: xác nhận đơn `pending -> processing`, chuyển giao hàng `processing -> shipping`, hoàn thành `completed`).

---

## III. LƯU Ý KỸ THUẬT QUAN TRỌNG CHO PHIÊN TIẾP THEO
1. **Bảng `carts` trong Database:** Bảng `carts` hiện tại là legacy từ `schema.sql` ban đầu và không được sử dụng vì ta dùng mô hình phẳng gắn `user_id` thẳng vào `cart_items`. Phiên tiếp theo không cần tạo liên kết tới bảng `carts`.
2. **Kiểm thử tự động:** Trước khi làm Ngày 16, hãy chạy `pytest` để đảm bảo hệ thống cũ luôn PASS 100%. Sau mỗi ngày trong Giai đoạn 4, hãy bổ sung file test tương ứng cho Backend.
3. **Định hướng thiết kế UI/UX:** Tiếp tục duy trì phong cách tinh gọn, sang trọng, hiện đại, màu sắc hài hòa (`text-gray-500`, button đỏ tiêu chuẩn), tuyệt đối không lạm dụng icon hay các huy hiệu màu sắc lòe loẹt gây cảm giác "AI/tự động hóa giá rẻ".
