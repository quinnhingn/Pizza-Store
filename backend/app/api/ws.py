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
    def __init__(self):
        # Maps user_id -> List[WebSocket]
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Keep track of which user_ids are admins for fast broadcast
        self.admin_user_ids = set()

    async def connect(self, websocket: WebSocket, user_id: int, is_admin: bool):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"WS Connect: user_id={user_id}, is_admin={is_admin}")
        
        if is_admin:
            self.admin_user_ids.add(user_id)
            print(f"Admin joined. Current admins: {self.admin_user_ids}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                if user_id in self.admin_user_ids:
                    self.admin_user_ids.remove(user_id)
                    print(f"Admin left. Current admins: {self.admin_user_ids}")

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_to_admins(self, message: dict):
        print(f"Broadcasting to admins: {self.admin_user_ids}, msg={message}")
        for admin_id in list(self.admin_user_ids):
            if admin_id in self.active_connections:
                for connection in self.active_connections[admin_id]:
                    try:
                        await connection.send_json(message)
                        print(f"Broadcast sent to admin {admin_id}")
                    except Exception as e:
                        print(f"Broadcast failed for admin {admin_id}: {e}")

manager = ConnectionManager()

async def get_user_from_token(token: str) -> Optional[User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = int(user_id_str)
    except JWTError:
        return None

    async with AsyncSessionLocal() as db:
        stmt = select(User).where(User.id == user_id, User.is_active == True)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        return user

@router.websocket("")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=1008) # Policy Violation
        return

    is_admin = (user.role == "admin")
    await manager.connect(websocket, user.id, is_admin)
    try:
        while True:
            # Keep connection open, wait for client messages if any
            # Typically client won't send anything for this use case, but we need to listen to avoid closing
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
    except Exception:
        manager.disconnect(websocket, user.id)
