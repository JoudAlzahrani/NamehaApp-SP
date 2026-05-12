from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from core.security import get_current_user
from services.finnhub_service import analyze_symbol
from services.portfolio_service import create_portfolio_if_not_exists, get_user_portfolio

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


class FundRequest(BaseModel):
    amount: float


@router.post("/create")
def create_portfolio(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    return create_portfolio_if_not_exists(db, user_id)


@router.post("/fund")
def fund_portfolio(body: FundRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    from models.portfolio import Portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not portfolio:
        portfolio = create_portfolio_if_not_exists(db, user_id)
    portfolio.cash_balance = body.amount
    db.commit()
    db.refresh(portfolio)
    return {"user_id": portfolio.user_id, "cash_balance": portfolio.cash_balance}


@router.get("/analyze/{symbol}")
def analyze_asset(symbol: str):
    return analyze_symbol(symbol)


@router.get("/me")
def get_my_portfolio(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    return get_user_portfolio(db, user_id)


@router.get("/{user_id}")
def get_portfolio_by_id(user_id: str, db: Session = Depends(get_db)):
    return get_user_portfolio(db, user_id)
