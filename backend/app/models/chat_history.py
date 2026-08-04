from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String(50), nullable=True, index=True)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    filters_applied = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User")
