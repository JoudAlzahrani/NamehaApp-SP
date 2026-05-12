"""
api/ai_analysis.py
------------------
Endpoints تحليل الذكاء الاصطناعي
"""

import sys
import os
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.finnhub_service import get_quote
from services.portfolio_service import buy_stock
from services.market_hours import is_market_open

AI_PATH = os.path.expanduser("~/Desktop/nameha-ai")

if AI_PATH not in sys.path:
    sys.path.insert(0, AI_PATH)

_original_dir = os.getcwd()
os.chdir(AI_PATH)

from analysis_agent import analyze_stock
from autoinvest_agent import preview_plan

os.chdir(_original_dir)

router = APIRouter(prefix="/ai-analysis", tags=["تحليل الاستثمار"])


class AnalyzeRequest(BaseModel):
    ticker: str
    scenario: str = "buy"
    user_id: str = "user1"
    user_name: str = ""
    amount_sar: float = 5000
    market: str = "SA"


class AutoInvestRequest(BaseModel):
    user_id: str = "user1"
    amount_sar: float = 5000
    duration_months: int = 6


class ExecutePlanRequest(BaseModel):
    user_id: str
    plan: Dict[str, Any]


@router.post("/analyze")
def analyze(body: AnalyzeRequest):
    os.chdir(AI_PATH)
    result = analyze_stock(
        ticker=body.ticker,
        scenario=body.scenario,
        user_id=body.user_id,
        user_name=body.user_name,
        amount_sar=body.amount_sar,
        market=body.market,
    )
    os.chdir(_original_dir)
    return result


@router.post("/autoinvest")
def autoinvest(body: AutoInvestRequest):
    os.chdir(AI_PATH)
    result = preview_plan(
        user_id=body.user_id,
        amount_sar=body.amount_sar,
        duration_months=body.duration_months,
    )
    os.chdir(_original_dir)
    return result


@router.post("/execute")
def execute_plan(body: ExecutePlanRequest, db: Session = Depends(get_db)):
    """تنفيذ خطة الاستثمار التلقائي — يشتري كل سهم في الخطة."""
    executed = []
    errors = []

    for sector in body.plan.get("sector_allocation", []):
        for stock in sector.get("top_stocks", []):
            ticker = stock.get("ticker", "").upper()
            amount = float(stock.get("amount_sar", 0))

            if not ticker or amount <= 0:
                continue

            open_, reason = is_market_open(ticker)
            if not open_:
                raise HTTPException(status_code=400, detail=reason)

            quote = get_quote(ticker)
            price = quote.get("c")

            if not price:
                errors.append({"ticker": ticker, "error": "تعذر جلب السعر"})
                continue

            result = buy_stock(db, body.user_id, ticker, price, amount)
            if "error" in result:
                errors.append({"ticker": ticker, "error": result["error"]})
            else:
                executed.append(result)

    return {
        "success": len(executed) > 0,
        "executed": executed,
        "errors": errors,
    }
