from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from core.security import get_current_user
from services.finnhub_service import get_quote, analyze_symbol
from services.portfolio_service import buy_stock, sell_stock, create_portfolio_if_not_exists
from services.market_hours import is_market_open
from models.position import Position

router = APIRouter(prefix="/trade", tags=["Manual Trade"])

RISK_CONCENTRATION_LIMIT = 0.40  # 40%


class BuyRequest(BaseModel):
    symbol: str
    budget: float


class SellRequest(BaseModel):
    symbol: str
    quantity: float


class RiskCheckRequest(BaseModel):
    symbol: str
    budget: float


@router.get("/analyze/{symbol}")
def analyze_stock(symbol: str):
    return analyze_symbol(symbol)


@router.post("/risk-check")
def risk_check(body: RiskCheckRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    """
    يتحقق إن كان التداول المقترح سيدفع تركيز السهم فوق حد المخاطرة.
    يُحذّر فقط إذا كان التداول هو السبب في تجاوز الحد (وليس لو كان فوقه أصلاً).
    """
    symbol = body.symbol.upper()
    portfolio = create_portfolio_if_not_exists(db, user_id)

    positions = db.query(Position).filter(Position.portfolio_id == portfolio.id).all()

    quote_data = get_quote(symbol)
    current_price = quote_data.get("c")
    if not current_price:
        raise HTTPException(status_code=400, detail="تعذّر جلب سعر السهم")

    # حساب القيمة السوقية الحالية لكل الأسهم
    total_market_value = sum(p.quantity * (get_quote(p.symbol).get("c") or p.avg_price) for p in positions)
    total_portfolio_value = portfolio.cash_balance + total_market_value

    # تركيز السهم الحالي
    symbol_position = next((p for p in positions if p.symbol == symbol), None)
    current_symbol_value = (symbol_position.quantity * current_price) if symbol_position else 0.0
    current_concentration = (current_symbol_value / total_portfolio_value) if total_portfolio_value > 0 else 0.0

    # تركيز السهم بعد التداول
    new_symbol_value = current_symbol_value + body.budget
    new_total_value = total_portfolio_value  # إجمالي القيمة لا يتغير (نقل من كاش لأسهم)
    after_concentration = (new_symbol_value / new_total_value) if new_total_value > 0 else 0.0

    # الحد مدروس: حذّر فقط إذا الصفقة هي اللي تدفع التركيز فوق الحد
    already_over_limit = current_concentration > RISK_CONCENTRATION_LIMIT
    will_exceed = after_concentration > RISK_CONCENTRATION_LIMIT
    should_warn = (not already_over_limit) and will_exceed

    return {
        "symbol": symbol,
        "current_concentration": round(current_concentration * 100, 1),
        "after_concentration": round(after_concentration * 100, 1),
        "risk_limit": round(RISK_CONCENTRATION_LIMIT * 100, 1),
        "already_over_limit": already_over_limit,
        "should_warn": should_warn,
    }


@router.post("/buy")
def buy(body: BuyRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    symbol = body.symbol.upper()

    open_, reason = is_market_open(symbol)
    if not open_:
        raise HTTPException(status_code=400, detail=reason)

    quote_data = get_quote(symbol)
    price = quote_data.get("c")
    if not price:
        raise HTTPException(status_code=400, detail="تعذّر جلب سعر السهم")

    result = buy_stock(db, user_id, symbol, price, body.budget)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/sell")
def sell(body: SellRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    symbol = body.symbol.upper()

    open_, reason = is_market_open(symbol)
    if not open_:
        raise HTTPException(status_code=400, detail=reason)

    quote_data = get_quote(symbol)
    price = quote_data.get("c")
    if not price:
        raise HTTPException(status_code=400, detail="تعذّر جلب سعر السهم")

    result = sell_stock(db, user_id, symbol, price, body.quantity)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
