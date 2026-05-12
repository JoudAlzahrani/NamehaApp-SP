from sqlalchemy import Column, Integer, Float, String
from database import Base

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    cash_balance = Column(Float, default=10000)