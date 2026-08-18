from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    ForeignKey,
    BigInteger,
    Text 
) 

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime 
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(255), unique=True, nullable=False, index=True)

    password_hash = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assets = relationship("Asset", back_populates="owner")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    file_name = Column(String(255), nullable=False)

    stored_name = Column(String(255), nullable=False)

    file_type = Column(String(100), nullable=False)

    file_size = Column(BigInteger, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="assets")

    summary = Column(Text, nullable=True)

    document_text = Column(Text)

    tags = Column(Text, nullable=True)

    # NEW
    expiry_date = Column(Date, nullable=True)

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    asset_id = Column(Integer, ForeignKey("assets.id"))

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

class ExpiryReminder(Base):
    __tablename__ = "expiry_reminders"

    id = Column(Integer, primary_key=True, index=True)

    asset_id = Column(
        Integer,
        ForeignKey("assets.id"),
        nullable=False
    )

    reminder_type = Column(
        String(20),
        nullable=False
    )

    sent_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    asset = relationship("Asset")