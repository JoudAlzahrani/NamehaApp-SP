import os
import time
import math
import requests
import yfinance as yf
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://finnhub.io/api/v1"
API_KEY = os.getenv("FINNHUB_API_KEY")

SAUDI_SYMBOLS = {
    "2222", "2010", "1120", "1180", "1150", "7010", "7020", "7030", "7040",
    "4002", "4004", "4020", "2060", "2082", "4030", "2380", "4300",
}


def _safe(value) -> float | None:
    """يحول nan/inf لـ None عشان JSON ما يعطل"""
    try:
        v = float(value)
        if math.isnan(v) or math.isinf(v):
            return None
        return round(v, 2)
    except Exception:
        return None


def _is_saudi(symbol: str) -> bool:
    return symbol.strip().upper() in SAUDI_SYMBOLS


def _get_saudi_quote(symbol: str) -> dict:
    try:
        stock = yf.Ticker(f"{symbol}.SR")
        hist = stock.history(period="5d")

        if hist.empty:
            return {"error": f"No data for {symbol}"}

        hist = hist.dropna(subset=["Close"])
        if hist.empty:
            return {"error": f"No valid data for {symbol}"}

        current = _safe(hist["Close"].iloc[-1])
        prev = _safe(hist["Close"].iloc[-2]) if len(hist) > 1 else current
        high = _safe(hist["High"].iloc[-1])
        low = _safe(hist["Low"].iloc[-1])
        open_price = _safe(hist["Open"].iloc[-1])

        if current is None:
            return {"error": f"No valid price for {symbol}"}

        day_change = round(current - prev, 2) if prev else 0
        day_change_pct = round(((current - prev) / prev) * 100, 2) if prev else 0

        return {
            "c": current,
            "pc": prev,
            "h": high,
            "l": low,
            "o": open_price,
            "d": day_change,
            "dp": day_change_pct,
        }

    except Exception as e:
        return {"error": str(e)}


def get_quote(symbol: str):
    symbol = symbol.strip().upper()

    if _is_saudi(symbol):
        return _get_saudi_quote(symbol)

    if not API_KEY:
        raise ValueError("FINNHUB_API_KEY is missing.")

    r = requests.get(
        f"{BASE_URL}/quote",
        params={"symbol": symbol, "token": API_KEY},
        timeout=15,
    )
    return r.json()


def analyze_symbol(symbol: str) -> dict:
    """تحليل مبسّط لسهم: السعر الحالي، التغيير اليومي، والاتجاه خلال 30 يوم."""
    symbol = symbol.strip().upper()
    quote = get_quote(symbol)
    candles = get_candles(symbol, resolution="D", days=30)

    closes = candles.get("c") or []
    trend = "غير كافي بيانات"
    if len(closes) >= 2 and closes[0]:
        change_pct = ((closes[-1] - closes[0]) / closes[0]) * 100
        if change_pct > 3:
            trend = f"اتجاه صاعد (~{change_pct:.1f}% خلال 30 يوم)"
        elif change_pct < -3:
            trend = f"اتجاه هابط (~{change_pct:.1f}% خلال 30 يوم)"
        else:
            trend = f"مستقر/متذبذب (~{change_pct:.1f}% خلال 30 يوم)"

    current = quote.get("c")
    pc = quote.get("pc")
    day_change = round(((current - pc) / pc) * 100, 2) if current and pc else None

    return {
        "symbol": symbol,
        "current_price": current,
        "day_change_percent": day_change,
        "trend_30d": trend,
        "beginner_note": "هذا تحليل مبسّط لمساعدتك قبل تنفيذ التداول اليدوي.",
    }


def get_candles(symbol: str, resolution: str = "D", days: int = 30):
    symbol = symbol.strip().upper()

    if not API_KEY:
        raise ValueError("FINNHUB_API_KEY is missing.")

    to_ts = int(time.time())
    from_ts = to_ts - (days * 24 * 60 * 60)

    r = requests.get(
        f"{BASE_URL}/stock/candle",
        params={
            "symbol": symbol,
            "resolution": resolution,
            "from": from_ts,
            "to": to_ts,
            "token": API_KEY,
        },
        timeout=15,
    )
    return r.json()