from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from core.security import get_current_user
from services.finnhub_service import get_quote, get_candles
from services.model_service import predict_direction_and_confidence
from services.proposal_service import (
    create_proposal,
    get_proposal,
    update_status,
    list_proposals,
)
from services.portfolio_service import buy_stock, sell_stock

router = APIRouter(prefix="/ai", tags=["توصيات ذكية"])


class ProposalRequest(BaseModel):
    symbol: str
    budget: float


def _build_features(symbol: str) -> dict:
    quote = get_quote(symbol)
    candles = get_candles(symbol, resolution="D", days=60)

    closes = candles.get("c") or []
    last_close = closes[-1] if closes else None
    prev_close = closes[-2] if len(closes) >= 2 else None
    momentum = None
    if last_close and prev_close:
        momentum = (last_close - prev_close) / prev_close

    return {
        "symbol": symbol.upper(),
        "current_price": quote.get("c"),
        "prev_close": quote.get("pc"),
        "momentum_1d": momentum,
        "closes_count": len(closes),
    }


@router.post("/propose")
def generate_proposal(body: ProposalRequest, user_id: str = Depends(get_current_user)):
    symbol = body.symbol.upper()
    features = _build_features(symbol)

    if not features.get("current_price"):
        raise HTTPException(status_code=400, detail="تعذّر جلب سعر السهم")

    pred = predict_direction_and_confidence(features)

    confidence = pred["confidence"]
    proposal = create_proposal({
        "user_id": user_id,
        "symbol": symbol,
        "action": pred["direction"],
        "confidence": confidence,
        "confidence_label": "مستوى الدقة",
        "confidence_percent": f"{round(confidence * 100)}%",
        "budget": body.budget,
        "current_price": features["current_price"],
        "explanation_ar": pred["reason_ar"],
        "features": {
            "momentum_1d": features["momentum_1d"],
            "closes_count": features["closes_count"],
        },
    })
    return proposal


@router.get("/proposals")
def get_user_proposals(user_id: str = Depends(get_current_user)):
    return list_proposals(user_id)


@router.get("/proposal/{proposal_id}")
def get_single_proposal(proposal_id: str, user_id: str = Depends(get_current_user)):
    p = get_proposal(proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail="الاقتراح غير موجود")
    if p["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="غير مصرح")
    return p


@router.post("/proposal/{proposal_id}/approve")
def approve_proposal(proposal_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    p = get_proposal(proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail="الاقتراح غير موجود")
    if p["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="غير مصرح")
    if p["status"] != "PENDING":
        raise HTTPException(status_code=400, detail=f"الاقتراح في حالة {p['status']} ولا يمكن تنفيذه")

    quote = get_quote(p["symbol"])
    price = quote.get("c")
    if not price:
        update_status(proposal_id, "FAILED")
        raise HTTPException(status_code=400, detail="تعذّر جلب السعر الحالي")

    action = p["action"]
    result = None

    if action == "BUY":
        result = buy_stock(db, user_id, p["symbol"], price, p["budget"])
    elif action == "SELL":
        quantity = p["budget"] / price
        result = sell_stock(db, user_id, p["symbol"], price, quantity)
    else:
        update_status(proposal_id, "REJECTED")
        raise HTTPException(status_code=400, detail="الاقتراح نوعه HOLD ولا يُنفَّذ")

    if "error" in (result or {}):
        update_status(proposal_id, "FAILED")
        raise HTTPException(status_code=400, detail=result["error"])

    update_status(proposal_id, "EXECUTED")
    return {"message": "تم تنفيذ الأمر بنجاح", "trade": result, "proposal_id": proposal_id}


@router.post("/proposal/{proposal_id}/reject")
def reject_proposal(proposal_id: str, user_id: str = Depends(get_current_user)):
    p = get_proposal(proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail="الاقتراح غير موجود")
    if p["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="غير مصرح")
    updated = update_status(proposal_id, "REJECTED")
    return {"message": "تم رفض الاقتراح", "proposal": updated}
