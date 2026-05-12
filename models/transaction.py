from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    symbol = Column(String)
    action = Column(String)  # BUY / SELL
    price = Column(Float)
    quantity = Column(Float)

    # 👇 هذا المهم الجديد
    created_at = Column(DateTime, default=datetime.utcnow)