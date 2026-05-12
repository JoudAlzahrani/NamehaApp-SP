"""
main.py — NAMEHA Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models.portfolio
import models.position
import models.transaction
import models.user_account

from api.auth import router as auth_router
from api.portfolio import router as portfolio_router
from api.manual_trade import router as manual_trade_router
from api.ai_trade import router as ai_trade_router
from api.ai_analysis import router as ai_analysis_router
from services.finnhub_service import get_quote

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NAMEHA API",
    description="منصة استثمار ذكية للمبتدئين",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(manual_trade_router)
app.include_router(ai_trade_router)
app.include_router(ai_analysis_router)


@app.get("/", tags=["Health"])
def home():
    return {"message": "NAMEHA Backend is running ✅", "version": "0.1.0"}


@app.get("/quote/{symbol}", tags=["Market Data"])
def quote(symbol: str):
    return get_quote(symbol.upper())