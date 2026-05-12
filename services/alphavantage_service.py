"""
services/alphavantage_service.py
---------------------------------
جلب أسعار الأسهم السعودية عبر Alpha Vantage.
رموز تداول تُضاف .SAU للسوق السعودي.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://www.alphavantage.co/query"
API_KEY = os.getenv("ALPHAVANTAGE_API_KEY", "6UARF42HIY8RV16I")


def get_saudi_quote(symbol: str) -> dict:
    """
    يجيب سعر سهم سعودي.
    symbol: رمز تداول مثل '2222' أو 'SABIC'
    """
    # Alpha Vantage يستخدم .SAU للسوق السعودي
    full_symbol = f"{symbol}.SAU"

    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": full_symbol,
        "apikey": API_KEY,
    }

    try:
        r = requests.get(BASE_URL, params=params, timeout=15)
        data = r.json()
        quote = data.get("Global Quote", {})

        if not quote or not quote.get("05. price"):
            # fallback: جرب بدون .SAU
            params["symbol"] = symbol
            r2 = requests.get(BASE_URL, params=params, timeout=15)
            data2 = r2.json()
            quote = data2.get("Global Quote", {})

        if not quote or not quote.get("05. price"):
            return {"error": f"No data found for {symbol}"}

        price = float(quote.get("05. price", 0))
        prev_close = float(quote.get("08. previous close", 0))
        change_pct = float(quote.get("10. change percent", "0%").replace("%", ""))
        high = float(quote.get("03. high", 0))
        low = float(quote.get("04. low", 0))
        open_price = float(quote.get("02. open", 0))

        return {
            "symbol": symbol,
            "c": price,           # current price
            "pc": prev_close,     # prev close
            "h": high,            # high
            "l": low,             # low
            "o": open_price,      # open
            "dp": change_pct,     # change percent
        }

    except Exception as e:
        return {"error": str(e)}


# رسم خريطة الأسهم السعودية المعروفة
SAUDI_SYMBOLS = {
    "2222": "2222",   # Aramco
    "2010": "2010",   # SABIC
    "7010": "7010",   # STC
    "1120": "1120",   # Al Rajhi
    "1180": "1180",   # SNB
    "4002": "4002",   # HHC
    "2060": "2060",   # Yanbu Cement
    "5110": "5110",   # Saudi Electricity
    "2082": "2082",   # ACWA Power
    "SABIC": "2010",
    "STC": "7010",
    "Aramco": "2222",
    "Al Rajhi": "1120",
}


def get_quote_smart(symbol: str) -> dict:
    """
    يحاول يجيب السعر بذكاء:
    - لو رمز أمريكي (AAPL, TSLA) → Finnhub
    - لو رمز سعودي → Alpha Vantage
    """
    mapped = SAUDI_SYMBOLS.get(symbol, symbol)
    return get_saudi_quote(mapped)
