**2.2 Database Schema**

* users

| id | SERIAL | PRIMARY KEY | Mã người dùng |
| :---- | :---- | :---- | :---- |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email dùng để đăng nhập |
| password\_hash | VARCHAR(255) | NOT NULL | Mã hóa mật khẩu |
| full\_name | VARCHAR(100) | NOT NULL | Họ và tên (hiển thị) |
| role | VARCHAR(20) | DEFAULT 'customer' | `admin` hoặc `customer` |
| is\_active | BOOLEAN | DEFAULT TRUE | Khóa/mở khóa tài khoản |
| created\_at | TIMESTAMP | DEFAULT NOW() | Ngày tạo |
| updated\_at | TIMESTAMP | DEFAULT NOW() | Cập nhật gần nhất |

* user\_addresses

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| user\_id | INTEGER | FOREIGN KEY (users.id) | Khách hàng sở hữu địa chỉ |
| full\_name | VARCHAR(100) | NOT NULL | Tên người nhận |
| phone | VARCHAR(20) | NOT NULL | Số điện thoại người nhận |
| address\_line | VARCHAR(255) | NOT NULL | Số nhà, đường, thôn/xóm |
| province | VARCHAR(50) | NOT NULL | Tỉnh/Thành phố |
| district | VARCHAR(50) |  | Quận/Huyện (có thể bỏ trống) |
| ward | VARCHAR(50) |  | Xã/Phường (có thể bỏ trống) |
| is\_default | BOOLEAN | DEFAULT FALSE | Địa chỉ mặc định (chỉ 1 duy nhất \= TRUE) |
| created\_at | TIMESTAMP | DEFAULT NOW() |  |
| updated\_at | TIMESTAMP | DEFAULT NOW() |  |

* categories

| id | SERIAL | PRIMARY KEY | Mã danh mục |
| :---- | :---- | :---- | :---- |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Tên danh mục (Pizza, Drink, Side) |
| description | TEXT |  | Mô tả |
| icon | VARCHAR(255) |  | Đường dẫn icon |
| created\_at | TIMESTAMP | DEFAULT NOW() |  |

* product

| id | SERIAL | PRIMARY KEY | Mã sản phẩm |
| :---- | :---- | :---- | :---- |
| name | VARCHAR(200) | NOT NULL | Tên sản phẩm |
| description | TEXT |  | Mô tả ngắn (có thể chứa nguyên liệu, nhưng không phải cấu trúc) |
| price | DECIMAL(10,2) | NOT NULL | Giá cơ bản (cho size M) |
| image\_url | VARCHAR(500) |  | Đường dẫn hình ảnh |
| category\_id | INTEGER | FOREIGN KEY (categories.id) | Danh mục (pizza, drink, side) |
| is\_available | BOOLEAN | DEFAULT TRUE | Trạng thái còn bán |
| created\_at | TIMESTAMP | DEFAULT NOW() | Ngày tạo |

* product\_toppings

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| product\_id | INTEGER | FOREIGN KEY (products.id) | Sản phẩm |
| topping\_name | VARCHAR(100) | NOT NULL | Tên topping |
| extra\_price | DECIMAL(10,2) | DEFAULT 0 | Giá thêm nếu chọn topping này |

* product\_sizes

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| product\_id | INTEGER | FOREIGN KEY (products.id) | Sản phẩm |
| size\_name | VARCHAR(20) | NOT NULL | S, M, L |
| price\_multiplier | DECIMAL(3,2) | DEFAULT 1.0 | Hệ số nhân giá (vd: M=1.0, L=1.2) |
| extra\_price | DECIMAL(10,2) | DEFAULT 0 | Giá cộng thêm tuyệt đối (nếu có) |

* orders

| id | SERIAL | PRIMARY KEY | Mã đơn hàng |
| :---- | :---- | :---- | :---- |
| user\_id | INTEGER | FOREIGN KEY (users.id) | Khách hàng |
| order\_code | VARCHAR(50) | UNIQUE, NOT NULL | Mã đơn (tự tạo) |
| total\_amount | DECIMAL(10,2) | NOT NULL | Tổng tiền sau giảm giá |
| discount\_amount | DECIMAL(10,2) | DEFAULT 0 | Số tiền được giảm |
| voucher\_code | VARCHAR(50) |  | Mã giảm giá đã áp dụng (nếu có) |
| status | VARCHAR(30) | DEFAULT 'pending' | pending, confirmed, delivering, completed, cancelled |
| shipping\_address | TEXT | NOT NULL | Địa chỉ giao hàng |
| shipping\_phone | VARCHAR(20) | NOT NULL | Số điện thoại nhận hàng |
| note | TEXT |  | Ghi chú |
| created\_at | TIMESTAMP | DEFAULT NOW() |  |
| updated\_at | TIMESTAMP | DEFAULT NOW() |  |

| shipping\_full\_name | VARCHAR(100) | NOT NULL | Tên người nhận |
| :---- | :---- | :---- | :---- |
| shipping\_address | TEXT | NOT NULL | Địa chỉ chi tiết (lưu chuỗi) |
| shipping\_phone | VARCHAR(20) | NOT NULL | Số điện thoại |
| shipping\_address\_id | INTEGER | FOREIGN KEY (user\_addresses.id) | (tùy chọn) tham chiếu đến địa chỉ trong sổ |

* order\_items

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| order\_id | INTEGER | FOREIGN KEY (orders.id) | Đơn hàng |
| product\_id | INTEGER | FOREIGN KEY (products.id) | Sản phẩm |
| quantity | INTEGER | NOT NULL | Số lượng |
| size\_name | VARCHAR(20) |  | Size đã chọn |
| unit\_price | DECIMAL(10,2) | NOT NULL | Giá tại thời điểm đặt |
| toppings | JSON |  | Danh sách topping đã chọn (dạng JSON) |

* reviews

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| user\_id | INTEGER | FOREIGN KEY (users.id) | Khách hàng |
| product\_id | INTEGER | FOREIGN KEY (products.id) | Sản phẩm |
| order\_id | INTEGER | FOREIGN KEY (orders.id) | Đơn hàng (để kiểm tra đã mua chưa) |
| rating | INTEGER | CHECK (1-5) | Số sao |
| comment | TEXT |  | Nội dung nhận xét |
| is\_approved | BOOLEAN | DEFAULT FALSE | Được admin duyệt chưa |
| admin\_reply | TEXT |  | Phản hồi của admin |
| created\_at | TIMESTAMP | DEFAULT NOW() |  |

* vouchers

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Mã code |
| discount\_percent | INTEGER |  | % giảm (0-100) |
| discount\_amount | DECIMAL(10,2) |  | Số tiền giảm trực tiếp (nếu không dùng %) |
| max\_discount | DECIMAL(10,2) |  | Giảm tối đa |
| min\_order\_value | DECIMAL(10,2) |  | Đơn hàng tối thiểu để áp dụng |
| start\_date | TIMESTAMP | NOT NULL |  |
| end\_date | TIMESTAMP | NOT NULL |  |
| usage\_limit | INTEGER |  | Số lần sử dụng tối đa |
| used\_count | INTEGER | DEFAULT 0 | Đã sử dụng bao nhiêu lần |
| is\_active | BOOLEAN | DEFAULT TRUE |  |
| created\_at | TIMESTAMP | DEFAULT NOW() |  |

* banners

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| title | VARCHAR(200) |  | Tiêu đề banner |
| image\_url | VARCHAR(500) | NOT NULL | Đường dẫn hình ảnh |
| link\_url | VARCHAR(500) |  | Link khi click vào banner |
| position | VARCHAR(30) | DEFAULT 'home' | Vị trí hiển thị |
| order\_index | INTEGER | DEFAULT 0 | Thứ tự hiển thị |
| is\_active | BOOLEAN | DEFAULT TRUE |  |
| start\_date | TIMESTAMP |  | (optional) |
| end\_date | TIMESTAMP |  | (optional) |
| created\_at | TIMESTAMP | DEFAULT NOW() |  |

* chat\_history

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| user\_id | INTEGER | FOREIGN KEY (users.id) | Khách hàng |
| session\_id | VARCHAR(100) |  | Định danh phiên chat (nếu cần) |
| question | TEXT | NOT NULL |  |
| answer | TEXT |  | Câu trả lời của AI |
| created\_at | TIMESTAMP | DEFAULT NOW() |  |

* carts

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| user\_id | INTEGER | FOREIGN KEY (users.id) | Giỏ hàng của ai (UNIQUE để mỗi user có 1 giỏ) |
| created\_at | TIMESTAMP | DEFAULT NOW() |  |
| updated\_at | TIMESTAMP | DEFAULT NOW() |  |

* cart\_items

| id | SERIAL | PRIMARY KEY |  |
| :---- | :---- | :---- | :---- |
| cart\_id | INTEGER | FOREIGN KEY (carts.id) | Nằm trong giỏ hàng nào |
| product\_id | INTEGER | FOREIGN KEY (products.id) | Sản phẩm |
| quantity | INTEGER | NOT NULL | Số lượng |
| size\_name | VARCHAR(20) |  | Kích cỡ (S, M, L) |
| toppings | JSON |  | Danh sách topping chọn thêm |
| added\_at | TIMESTAMP | DEFAULT NOW() |  |

`* ingredients`   
`| Cột | Kiểu | Ràng buộc | Mô tả | | :--- | :--- | :--- | :--- | | id | SERIAL | PRIMARY KEY | | | name | VARCHAR(100) | UNIQUE, NOT NULL | Tên nguyên liệu (bột, phô mai, tôm...) |`   
`* product_ingredients`   
`| Cột | Kiểu | Ràng buộc | Mô tả | | :--- | :--- | :--- | :--- | | id | SERIAL | PRIMARY KEY | | | product_id | INTEGER | FOREIGN KEY (products.id) | | | ingredient_id | INTEGER | FOREIGN KEY (ingredients.id) | |` 

**2.3 Mối quan hệ giữa các bảng (ER Diagram)**

* users (1) \----\< (n) user\_addresses  
* user\_addresses (1) \----? (0..1) orders (khi đặt từ địa chỉ có sẵn)  
* users 1---n orders (một khách hàng có nhiều đơn)  
* orders 1---n order\_items (một đơn có nhiều sản phẩm)  
* products 1---n order\_items (một sản phẩm xuất hiện trong nhiều order\_item)  
* users 1---1 carts (một khách hàng có 1 giỏ hàng active)   
* carts 1---n cart\_items (một giỏ hàng có nhiều sản phẩm)   
* products 1---n cart\_items (một sản phẩm nằm trong nhiều cart\_items)   
* products 1---n product\_ingredients (một sản phẩm có nhiều nguyên liệu)   
* ingredients 1---n product\_ingredients (một nguyên liệu nằm trong nhiều sản phẩm)   
* categories 1---n products (một danh mục có nhiều sản phẩm)  
* products 1---n product\_toppings (một sản phẩm có nhiều topping)  
* products 1---n product\_sizes (một sản phẩm có nhiều size)  
* users 1---n reviews (một khách hàng viết nhiều đánh giá)  
* products 1---n reviews (một sản phẩm nhận nhiều đánh giá)  
* orders 1---n reviews (một đơn có thể có nhiều review)  
* vouchers 0---n orders (một voucher có thể được áp dụng cho nhiều đơn, nhưng mỗi đơn chỉ dùng tối đa 1 voucher)

