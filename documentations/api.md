  
\#\#\# 🛠 Quy ước chung cho API

\- \*\*Base URL\*\*: \`http://localhost:8000/api/v1\`  
\- \*\*Response format\*\*:  
  \`\`\`json  
  {  
    "status": "success" | "error",  
    "data": { ... } | null,  
    "message": "Thông báo chi tiết" | null  
  }  
  \`\`\`  
\- \*\*Authentication\*\*: Gửi token trong Header \`Authorization: Bearer \<access\_token\>\` cho các API yêu cầu đăng nhập.  
\- \*\*Phân quyền\*\*:   
  \- \`\[Public\]\`: Không cần token.  
  \- \`\[Customer\]\`: Token của customer.  
  \- \`\[Admin\]\`: Token của admin.

\---

\#\#\# 1\. Nhóm API Xác thực (Auth) – \`\[Public\]\`

| Method | Endpoint | Mô tả | Request Body | Response |  
|--------|----------|-------|--------------|----------|  
| \*\*POST\*\* | \`/auth/register\` | Đăng ký tài khoản mới | \`{ "email", "password", "confirm\_password", "full\_name" }\` | \`{ "user\_id", "email", "full\_name" }\` |  
| \*\*POST\*\* | \`/auth/login\` | Đăng nhập | \`{ "email", "password" }\` | \`{ "access\_token", "token\_type": "bearer", "user": { "id", "email", "full\_name", "role" } }\` |  
| \*\*POST\*\* | \`/auth/logout\` | Đăng xuất (Client xóa token) | \_(không cần body)\_ | \`{ "message": "Logged out" }\` |

\---

\#\#\# 2\. Nhóm API Người dùng & Sổ địa chỉ (Profile & Address) – \`\[Customer\]\`

| Method | Endpoint | Mô tả | Request Body | Response |  
|--------|----------|-------|--------------|----------|  
| \*\*GET\*\* | \`/users/me\` | Lấy thông tin cá nhân | \_Không\_ | \`{ "id", "email", "full\_name", "role", "created\_at" }\` |  
| \*\*PUT\*\* | \`/users/me\` | Cập nhật thông tin cá nhân (họ tên) | \`{ "full\_name" }\` | \`{ "id", "email", "full\_name" }\` |  
| \*\*GET\*\* | \`/users/me/addresses\` | Lấy danh sách địa chỉ của tôi | \_Không\_ | \`\[ { "id", "full\_name", "phone", "address\_line", "province", "district", "ward", "is\_default" } \]\` |  
| \*\*POST\*\* | \`/users/me/addresses\` | Thêm địa chỉ mới | \`{ "full\_name", "phone", "address\_line", "province", "district" (opt), "ward" (opt), "is\_default" (bool) }\` | \`{ "id", ... }\` (object vừa tạo) |  
| \*\*PUT\*\* | \`/users/me/addresses/{id}\` | Sửa địa chỉ | \`{ "full\_name", "phone", "address\_line", ... }\` | \`{ "id", ... }\` (object đã cập nhật) |  
| \*\*DELETE\*\* | \`/users/me/addresses/{id}\` | Xóa địa chỉ | \_Không\_ | \`{ "message": "Deleted" }\` |  
| \*\*PUT\*\* | \`/users/me/addresses/{id}/default\` | Đặt làm địa chỉ mặc định | \_Không\_ | \`{ "message": "Default address updated" }\` |

\---

\#\#\# 3\. Nhóm API Sản phẩm & Danh mục – \`\[Public\]\` (trừ Admin)

| Method | Endpoint | Mô tả | Request Params/Body | Response |  
|--------|----------|-------|---------------------|----------|  
| \*\*GET\*\* | \`/categories\` | Lấy danh sách danh mục | \_Không\_ | \`\[ { "id", "name", "icon" } \]\` |  
| \*\*GET\*\* | \`/products\` | Lấy danh sách sản phẩm (có filter) | Query: \`?category\_id=1\&min\_price=100\&max\_price=300\&search=pizza\&page=1\&limit=20\` | \`{ "items": \[ { "id", "name", "price", "image\_url", "category" } \], "total", "page", "limit" }\` |  
| \*\*GET\*\* | \`/products/{id}\` | Lấy chi tiết sản phẩm | Path: \`id\` | \`{ "id", "name", "description", "price", "image\_url", "category", "sizes": \[ { "size\_name", "price\_multiplier", "extra\_price" } \], "toppings": \[ { "id", "topping\_name", "extra\_price" } \], "is\_available" }\` |  
| \*\*GET\*\* | \`/products/{id}/reviews\` | Lấy đánh giá của sản phẩm | Path: \`id\` | \`\[ { "user\_name", "rating", "comment", "created\_at" } \]\` |

\---

\#\#\# 4\. Nhóm API Giỏ hàng (Cart) – \`\[Customer\]\`

\*(Giả định bạn đã tạo bảng \`carts\` và \`cart\_items\`)\*

| Method | Endpoint | Mô tả | Request Body | Response |  
|--------|----------|-------|--------------|----------|  
| \*\*GET\*\* | \`/cart\` | Xem giỏ hàng hiện tại | \_Không\_ | \`{ "items": \[ { "product\_id", "name", "image\_url", "size\_name", "toppings": \[...\], "quantity", "unit\_price", "subtotal" } \], "total\_amount", "discount", "final\_amount" }\` |  
| \*\*POST\*\* | \`/cart/items\` | Thêm sản phẩm vào giỏ | \`{ "product\_id", "size\_name", "toppings": \[ "topping\_name1", ... \], "quantity" }\` | \`{ "message": "Added", "cart\_item\_id": 1 }\` |  
| \*\*PUT\*\* | \`/cart/items/{id}\` | Cập nhật số lượng sản phẩm | \`{ "quantity" }\` | \`{ "message": "Updated" }\` |  
| \*\*DELETE\*\* | \`/cart/items/{id}\` | Xóa 1 sản phẩm khỏi giỏ | \_Không\_ | \`{ "message": "Removed" }\` |  
| \*\*DELETE\*\* | \`/cart/clear\` | Xóa toàn bộ giỏ hàng | \_Không\_ | \`{ "message": "Cleared" }\` |

\---

\#\#\# 5\. Nhóm API Mã giảm giá (Voucher) – \`\[Customer\]\`

| Method | Endpoint | Mô tả | Request Body | Response |  
|--------|----------|-------|--------------|----------|  
| \*\*GET\*\* | \`/vouchers/available\` | Lấy danh sách mã giảm giá đang khả dụng | \_Không\_ | \`\[ { "id", "code", "discount\_percent", "max\_discount", "min\_order\_value" } \]\` |  
| \*\*POST\*\* | \`/vouchers/apply\` | Áp dụng mã vào giỏ hàng (tính toán) | \`{ "code": "PIZZA20" }\` | \`{ "valid": true, "discount\_amount": 40000, "total\_after\_discount": 160000 }\` \*(hoặc lỗi nếu invalid)\* |

\---

\#\#\# 6\. Nhóm API Đơn hàng (Orders) – \`\[Customer\]\`

| Method | Endpoint | Mô tả | Request Body | Response |  
|--------|----------|-------|--------------|----------|  
| \*\*POST\*\* | \`/orders\` | Tạo đơn hàng mới (Checkout) | \`{ "shipping\_address\_id" (opt, nếu có sẵn), "shipping\_full\_name", "shipping\_phone", "shipping\_address" (chi tiết), "voucher\_code" (opt), "note" }\` | \`{ "order\_id", "order\_code", "total\_amount", "status": "pending" }\` |  
| \*\*GET\*\* | \`/orders\` | Lấy danh sách đơn hàng của tôi | Query: \`?page=1\&limit=10\` | \`{ "items": \[ { "id", "order\_code", "total\_amount", "status", "created\_at" } \], "total" }\` |  
| \*\*GET\*\* | \`/orders/{id}\` | Lấy chi tiết 1 đơn hàng | Path: \`id\` | \`{ "id", "order\_code", "status", "total\_amount", "shipping\_full\_name", "shipping\_address", "items": \[ { "product\_name", "quantity", "size", "toppings", "unit\_price" } \], "created\_at" }\` |  
| \*\*PUT\*\* | \`/orders/{id}/cancel\` | Hủy đơn hàng (chỉ khi \`pending\`) | \_Không\_ | \`{ "message": "Order cancelled", "status": "cancelled" }\` |

\---

\#\#\# 7\. Nhóm API Đánh giá (Reviews) – \`\[Customer\]\`

| Method | Endpoint | Mô tả | Request Body | Response |  
|--------|----------|-------|--------------|----------|  
| \*\*POST\*\* | \`/orders/{order\_id}/reviews\` | Viết đánh giá cho sản phẩm trong đơn hàng | \`{ "product\_id", "rating" (1-5), "comment" }\` | \`{ "review\_id", "message": "Review submitted" }\` |

\---

\#\#\# 8\. Nhóm API Public (Không cần login)

| Method | Endpoint | Mô tả | Response |  
|--------|----------|-------|----------|  
| \*\*GET\*\* | \`/banners\` | Lấy danh sách banner đang hiển thị | \`\[ { "id", "image\_url", "link\_url", "title" } \]\` |

\---

\#\#\# 9\. Nhóm API dành riêng cho Admin – \`\[Admin\]\`  
(Tất cả endpoint `/admin/*` yêu cầu middleware/dependency kiểm tra field `role == 'admin'` từ JWT Payload )

\*\*9.1. Dashboard & Thống kê\*\*  
| Method | Endpoint | Mô tả |  
|--------|----------|-------|  
| GET | \`/admin/dashboard\` | \`{ "total\_revenue\_today", "total\_orders\_today", "new\_customers", "top\_products": \[...\] }\` |  
| GET | \`/admin/reports/revenue\` | Query: \`?from=2025-01-01\&to=2025-01-31\&group=day\` |  
| GET | \`/admin/reports/top-products\` | \`?limit=5\&from=...\&to=...\` |

\*\*9.2. Quản lý sản phẩm (Product Management)\*\*  
| Method | Endpoint | Mô tả |  
|--------|----------|-------|  
| POST | \`/admin/products\` | Tạo sản phẩm mới (kèm sizes, toppings) |  
| PUT | \`/admin/products/{id}\` | Cập nhật sản phẩm |  
| DELETE | \`/admin/products/{id}\` | Xóa sản phẩm (hoặc set is\_available=false) |  
| POST | \`/admin/products/{id}/toppings\` | Thêm topping cho sản phẩm |  
| PUT | \`/admin/products/{id}/toppings/{topping\_id}\` | Cập nhật topping |  
| DELETE | \`/admin/products/{id}/toppings/{topping\_id}\` | Xóa topping |  
\*(Tương tự cho Category, Size)\*

\*\*9.3. Quản lý đơn hàng (Order Management)\*\*  
| Method | Endpoint | Mô tả |  
|--------|----------|-------|  
| GET | \`/admin/orders\` | Xem tất cả đơn hàng (filter theo status, date) |  
| GET | \`/admin/orders/{id}\` | Xem chi tiết đơn hàng bất kỳ |  
| PUT | \`/admin/orders/{id}/status\` | Cập nhật trạng thái: \`{ "status": "confirmed" | "delivering" | "completed" | "cancelled" }\` |

\*\*9.4. Quản lý khách hàng & đánh giá\*\*  
| Method | Endpoint | Mô tả |  
|--------|----------|-------|  
| GET | \`/admin/users\` | Danh sách users (có tìm kiếm) |  
| PUT | \`/admin/users/{id}/block\` | Khóa/mở khóa user \`{ "is\_active": false }\` |  
| GET | \`/admin/reviews\` | Danh sách đánh giá (có lọc đã duyệt/chưa) |  
| PUT | \`/admin/reviews/{id}/approve\` | Duyệt đánh giá \`{ "is\_approved": true }\` |  
| POST | \`/admin/reviews/{id}/reply\` | Admin phản hồi \`{ "admin\_reply": "..." }\` |

\*\*9.5. Quản lý Voucher & Banner\*\*  
| Method | Endpoint | Mô tả |  
|--------|----------|-------|  
| POST | \`/admin/vouchers\` | Tạo mã giảm giá |  
| PUT | \`/admin/vouchers/{id}\` | Sửa mã |  
| DELETE | \`/admin/vouchers/{id}\` | Xóa (hoặc disable) |  
| POST | \`/admin/banners\` | Thêm banner mới |  
| PUT | \`/admin/banners/{id}\` | Sửa banner |  
| DELETE | \`/admin/banners/{id}\` | Xóa banner |

\#\#\# 10\. Nhóm Chatbot AI – \`\[Customer\]\`

| Method | Endpoint | Mô tả | Request Body | Response |  
|--------|----------|-------|--------------|----------|  
| \*\*POST\*\* | \`/chat\` | Gửi câu hỏi cho AI và nhận JSON phân tích | \`{ "question": "Gợi ý pizza không có tôm..." }\` | \`{ "intent": "search\_product", "filters": { ... }, "reply\_text": "..." }\` |

\---  
