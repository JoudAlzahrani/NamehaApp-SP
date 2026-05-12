from sqlalchemy import Column, Integer, Float, String, ForeignKey
from database import Base

class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String, index=True, nullable=False)
    quantity = Column(Float, default=0.0)
    avg_price = Column(Float, default=0.0)

    