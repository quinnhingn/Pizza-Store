
**1.1 Các bên liên quan (Stakeholders)**

- Khách hàng (Customer): user cuối, đặt pizza, sử dụng chatbot  
- Quản trị viên (Admin): Quản lý cửa hàng, sản phẩm, đơn hàng,...  
- Hệ thống (System): xử lý logic, lưu trữ data, tích hợp AI

**1.2 Functional Requirements**

* Customer 

| Mã | Chức năng | Mô tả |
| :---- | :---- | :---- |
| C-01 | Đăng ký | Tạo tài khoản với email, mật khẩu, tên, số điện thoại |
| C-02 | Đăng nhập | Đăng nhập bằng email \+ mật khẩu |
| C-03 | Đăng xuất | Kết thúc phiên đăng nhập |
| C-04 | Xem danh sách sản phẩm | Xem tất cả pizza, có phân trang và lọc theo danh mục |
| C-05 | Lọc sản phẩm | Lọc theo giá, topping, danh mục (pizza, drink, side) |
| C-06 | Xem chi tiết sản phẩm | Hình ảnh, mô tả, các size có sẵn, topping kèm theo, giá |
| C-07 | Thêm vào giỏ hàng | Chọn size, topping, số lượng rồi thêm vào giỏ |
| C-08 | Quản lý giỏ hàng | Xem, tăng/giảm số lượng, xóa sản phẩm khỏi giỏ |
| C-09 | Áp dụng mã giảm giá | Nhập mã khuyến mãi trong giỏ hàng, tính lại tổng tiền |
| C-10 | Đặt hàng | Nhập thông tin giao hàng (địa chỉ, số điện thoại), xác nhận đơn hàng |
| C-11 | Xem lịch sử đơn hàng | Danh sách các đơn hàng đã đặt |
| C-12 | Xem chi tiết đơn hàng | Trạng thái, tổng tiền, danh sách sản phẩm trong đơn |
| C-13 | Hủy đơn hàng (nếu chưa xác nhận) | Cho phép hủy đơn khi ở trạng thái chờ xác nhận |
| C-14 | Đánh giá sản phẩm | Đánh giá (sao) và viết nhận xét cho sản phẩm đã mua |
| C-15 | Xem đánh giá | Xem đánh giá của người khác trên trang chi tiết sản phẩm |
| C-16 | Chatbot AI | Đặt câu hỏi bằng tiếng Việt, nhận gợi ý pizza/phụ kiện dựa trên dữ liệu database |
| C-17 | Xem banner / khuyến mãi | Trang chủ hiển thị banner quảng cáo và danh sách chương trình khuyến mãi đang diễn ra |
| C-18 | Cập nhật thông tin cá nhân | Thay đổi họ tên, số điện thoại, địa chỉ giao hàng mặc định |

* Admin

| Mã | Chức năng | Mô tả |
| :---- | :---- | :---- |
| A-01 | Đăng nhập admin | Đăng nhập với quyền admin (riêng biệt) |
| A-02 | Dashboard | Xem tổng quan: số đơn hàng hôm nay, doanh thu, sản phẩm bán chạy, khách mới |
| A-03 | Quản lý sản phẩm | Thêm, sửa, xóa, xem danh sách sản phẩm |
| A-04 | Quản lý danh mục | Thêm, sửa, xóa danh mục (Pizza, Drink, Side) |
| A-05 | Quản lý topping | Thêm, sửa, xóa topping, gán topping vào từng sản phẩm |
| A-06 | Quản lý kích cỡ | Thiết lập các size (S, M, L) và giá áp dụng |
| A-07 | Quản lý đơn hàng | Xem danh sách, cập nhật trạng thái (xác nhận, giao hàng, hoàn thành, hủy) |
| A-08 | Quản lý khách hàng | Xem danh sách, chi tiết (lịch sử mua hàng), khóa/mở khóa tài khoản |
| A-09 | Quản lý mã giảm giá | Tạo mã code, % giảm, số tiền tối đa, thời hạn, số lần sử dụng |
| A-10 | Quản lý đánh giá | Xem, duyệt/ẩn đánh giá, phản hồi đánh giá của khách hàng |
| A-11 | Báo cáo doanh thu | Theo ngày, tuần, tháng, năm; xem biểu đồ cột/đường |
| A-12 | Báo cáo sản phẩm | Top sản phẩm bán chạy, top topping được chọn nhiều |
| A-13 | Quản lý banner | Thêm, sửa, xóa banner hiển thị trên trang chủ (có hình ảnh, link) |
| A-14 | Nhật ký hoạt động (tùy chọn) | Ghi lại các thao tác quan trọng của admin |

**1.3 Các luồng hoạt động chính (User Flows)**

*Luồng 1: Khách hàng đặt hàng thành công*  
Trang chủ  
   ↓  
\[Xem danh sách pizza / lọc theo topping/giá\]  
   ↓  
\[Chọn pizza → Xem chi tiết → Chọn size, topping → Thêm vào giỏ\]  
   ↓  
\[Tiếp tục mua hoặc vào giỏ hàng\]  
   ↓  
\[Giỏ hàng: xem, sửa số lượng, nhập mã giảm giá (nếu có)\]  
   ↓  
\[Tiến hành thanh toán → Điền thông tin giao hàng\]  
   ↓  
\[Xác nhận đơn hàng → Hiển thị thông báo thành công\]  
   ↓  
\[Xem lịch sử đơn hàng để kiểm tra trạng thái\]

*Luồng 2: Chatbot AI tương tác đa bước*  
Khách hàng mở chat  
   ↓  
Nhập câu hỏi: "Gợi ý pizza không có tôm và cà chua"  
   ↓  
Backend nhận → Gửi tới Gemini với prompt:  
   \- Phân tích câu hỏi → chuyển thành điều kiện lọc  
   \- Truy vấn database → lấy danh sách sản phẩm phù hợp  
   \- Sinh câu trả lời dạng có cấu trúc:  
        \* Tiêu đề giới thiệu  
        \* Mỗi món: tên, mô tả ngắn, giá, hình ảnh  
        \* Kèm các nút hành động: \[Đặt món\], \[Xem chi tiết\]  
        \* Các gợi ý nhanh khác: Xem menu đầy đủ, Pizza Hải Sản, Ưu đãi hôm nay  
   ↓  
Frontend hiển thị kết quả (dạng card sản phẩm \+ nút bấm)  
   ↓  
Khách hàng có thể:  
   \- Nhấn \[Đặt món\] → thêm trực tiếp vào giỏ hàng  
   \- Nhấn \[Xem chi tiết\] → chuyển sang trang sản phẩm  
   \- Nhấn một trong các gợi ý nhanh (Xem menu, Pizza Hải Sản...) → gửi câu hỏi tương ứng  
   \- Hoặc tiếp tục nhập câu hỏi mới (có giữ ngữ cảnh)   
      ví dụ: "Giá khoảng 200k" → AI sẽ lọc tiếp từ danh sách hiện tại  
   ↓  
AI phản hồi với danh sách đã lọc, kèm các nút tương tác tương tự

*Luồng 3: Admin quản lý sản phẩm*  
Admin đăng nhập → Dashboard  
   ↓  
Chọn "Quản lý sản phẩm"  
   ↓  
Xem danh sách sản phẩm (tìm kiếm, phân trang)  
   ↓  
Chọn "Thêm sản phẩm mới"  
   ↓  
Nhập tên, mô tả, giá, danh mục, tải ảnh  
   ↓  
Chọn "Thêm topping" (có thể chọn từ danh sách có sẵn)  
   ↓  
Chọn "Thêm kích cỡ" (S, M, L với giá tương ứng)  
   ↓  
Lưu → sản phẩm xuất hiện trên cửa hàng

*Luồng 4: Admin xử lý đơn hàng*  
Admin đăng nhập → Dashboard  
   ↓  
Chọn "Quản lý đơn hàng"  
   ↓  
Xem danh sách đơn hàng mới nhất  
   ↓  
Chọn một đơn hàng → xem chi tiết  
   ↓  
Cập nhật trạng thái: "Xác nhận" → "Đang giao" → "Hoàn thành"  
   ↓  
(Hoặc "Hủy" nếu khách yêu cầu hoặc không hợp lệ)  
   ↓  
Khách hàng nhận được thông báo (trên app/web) về trạng thái mới

*Luồng 5: Admin tạo mã giảm giá*  
Admin → Quản lý mã giảm giá  
   ↓  
Chọn "Tạo mã mới"  
   ↓  
Nhập: mã code, % giảm, giá trị tối đa, ngày bắt đầu/kết thúc, số lượng  
   ↓  
Lưu → mã có sẵn cho khách hàng sử dụng

*Luồng 6: Khách hàng đánh giá sản phẩm*  
Khách hàng vào "Lịch sử đơn hàng"  
   ↓  
Chọn đơn hàng đã hoàn thành  
   ↓  
Trong chi tiết đơn hàng, bên cạnh mỗi sản phẩm có nút "Đánh giá"  
   ↓  
Nhấn nút → chọn số sao (1-5), viết nhận xét  
   ↓  
Gửi đánh giá → Admin có thể duyệt/ẩn 
