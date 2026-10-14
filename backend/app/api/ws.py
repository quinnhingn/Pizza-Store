import json
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import SECRET_KEY, ALGORITHM
from app.core.database import AsyncSessionLocal
from app.models.user import User

router = APIRouter()

class ConnectionManager:
    """Quản lý tập trung tất cả các kết nối WebSocket (Đóng vai trò như một tổng đài phân phối tin nhắn Real-time)."""

    def __init__(self):
        # Bản đồ: user_id -> danh sách WebSocket (một user có thể mở nhiều tab)
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Tập hợp (Set) chứa ID của các Admin. Dùng Set để tìm kiếm cực nhanh O(1) khi cần gửi thông báo cho toàn bộ Admin
        self.admin_user_ids = set()

    async def connect(self, websocket: WebSocket, user_id: int, is_admin: bool):
        """Chấp nhận kết nối WebSocket mới và đăng ký vào danh sách quản lý."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"WS Connect: user_id={user_id}, is_admin={is_admin}")
        
        if is_admin:
            self.admin_user_ids.add(user_id)
            print(f"Admin joined. Current admins: {self.admin_user_ids}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        """Xử lý ngắt kết nối WebSocket và dọn dẹp khỏi danh sách quản lý."""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            # Nếu user không còn kết nối nào, xóa khỏi dict và admin set
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                if user_id in self.admin_user_ids:
                    self.admin_user_ids.remove(user_id)
                    print(f"Admin left. Current admins: {self.admin_user_ids}")

    async def send_personal_message(self, message: dict, user_id: int):
        """Gửi tin nhắn JSON tới một user cụ thể qua tất cả kết nối của họ."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass  # Bỏ qua lỗi kết nối đã đóng

    async def broadcast_to_admins(self, message: dict):
        # Hàm siêu quan trọng cho Kanban Board: Bắn tín hiệu JSON "Có đơn hàng mới" cho tất cả các trình duyệt Admin đang mở
        """Broadcast tin nhắn JSON tới tất cả Admin đang kết nối."""
        try:
            print(f"Broadcasting to admins: {self.admin_user_ids}, msg={message}")
        except Exception:
            pass
        for admin_id in list(self.admin_user_ids):
            if admin_id in self.active_connections:
                for connection in self.active_connections[admin_id]:
                    try:
                        await connection.send_json(message)
                        print(f"Broadcast sent to admin {admin_id}")
                    except Exception as e:
                        try:
                            print(f"Broadcast failed for admin {admin_id}: {e}")
                        except Exception:
                            pass

# Singleton instance dùng chung trong toàn bộ ứng dụng
manager = ConnectionManager()

async def get_user_from_token(token: str) -> Optional[User]:
    """
    Xác thực JWT token từ query param WebSocket và trả về User.
    Trả về None nếu token không hợp lệ hoặc user không tồn tại.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = int(user_id_str)
    except JWTError as e:
        print(f"WS JWT Error: {e}")
        return None

    # Mở phiên DB riêng để xác thực user (không dùng dependency injection trong WS)
    async with AsyncSessionLocal() as db:
        try:
            stmt = select(User).where(User.id == user_id, User.is_active == True)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            if not user:
                print(f"WS Auth Failed: User {user_id} not found or inactive")
            return user
        except Exception as e:
            print(f"WS DB Error: {e}")
            return None

@router.websocket("")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # Bước 1: Client gọi lên Endpoint này kèm theo JWT Token để mở đường ống kết nối 2 chiều (Real-time)
    # Bước 2: Hệ thống sẽ giải mã Token để biết ai đang kết nối (Admin hay Khách hàng) để đưa vào danh sách quản lý
    """
    Endpoint WebSocket chính.
    Xác thực token -> Kết nối -> Giữ kết nối mở -> Ngắt kết nối khi client đóng.
    """
    user = await get_user_from_token(token)
    if not user:
        # Đóng kết nối với mã 1008 (Policy Violation) nếu token không hợp lệ
        await websocket.close(code=1008)
        return

    is_admin = (user.role == "admin")
    await manager.connect(websocket, user.id, is_admin)
    try:
        while True:
            # Giữ kết nối mở bằng cách chờ tin nhắn từ client
            # Client thường không gửi gì, nhưng cần listen để phát hiện ngắt kết nối
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
    except Exception:
        manager.disconnect(websocket, user.id)
