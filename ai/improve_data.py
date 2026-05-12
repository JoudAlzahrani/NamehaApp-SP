import pandas as pd
import numpy as np
import yfinance as yf
import os
import ta  # technical analysis library

os.makedirs("data_improved", exist_ok=True)

stocks = ["2222", "2010", "1120", "7010", "4002", "1180", "2380", "4300",
    "1211", "2350", "4001", "1050", "1080", "2290", "4030", "2160",
    "4040", "1010", "1030", "3010"]

print("Building improved dataset with technical indicators...\n")

for ticker in stocks:
    symbol = f"{ticker}.SR"
    print(f"Processing {symbol}...")

    try:
        df = yf.download(symbol, start="2018-01-01", 
                        end="2024-12-31", progress=False)

        if df.empty:
            print(f"  ⚠️  No data, skipping")
            continue

        # Flatten columns if needed
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [col[0] for col in df.columns]

        df = df[["Close", "Volume", "High", "Low", "Open"]].copy()
        df = df.dropna()

        # ── TECHNICAL INDICATORS ──────────────────────────

        # 1. RSI — measures if stock is overbought or oversold
        # Below 30 = oversold (good time to buy)
        # Above 70 = overbought (might drop soon)
        df["rsi"] = ta.momentum.RSIIndicator(
            close=df["Close"], window=14
        ).rsi()

        # 2. MACD — measures momentum and trend direction
        macd = ta.trend.MACD(close=df["Close"])
        df["macd"]        = macd.macd()
        df["macd_signal"] = macd.macd_signal()
        df["macd_diff"]   = macd.macd_diff()

        # 3. Bollinger Bands — measures price volatility
        bb = ta.volatility.BollingerBands(close=df["Close"])
        df["bb_high"]  = bb.bollinger_hband()
        df["bb_low"]   = bb.bollinger_lband()
        df["bb_width"] = bb.bollinger_wband()

        # 4. Moving averages — smoothed price trends
        df["sma_7"]  = df["Close"].rolling(7).mean()   # 7-day average
        df["sma_21"] = df["Close"].rolling(21).mean()  # 21-day average
        df["sma_50"] = df["Close"].rolling(50).mean()  # 50-day average

        # 5. EMA — exponential moving average (recent days weighted more)
        df["ema_12"] = df["Close"].ewm(span=12).mean()
        df["ema_26"] = df["Close"].ewm(span=26).mean()

        # 6. Volume indicators
        df["volume_sma"]   = df["Volume"].rolling(20).mean()
        df["volume_ratio"] = df["Volume"] / df["volume_sma"]

        # 7. Price momentum
        df["momentum_5"]  = df["Close"].pct_change(5)   # 5-day change
        df["momentum_10"] = df["Close"].pct_change(10)  # 10-day change
        df["momentum_20"] = df["Close"].pct_change(20)  # 20-day change

        # 8. Daily change
        df["change_pct"] = df["Close"].pct_change()

        # 9. High-Low range (measures daily volatility)
        df["hl_range"] = (df["High"] - df["Low"]) / df["Close"]

        # Drop rows with NaN (from rolling calculations)
        df = df.dropna()

        # Save
        filename = f"data_improved/{ticker}.csv"
        df.to_csv(filename)
        print(f"  ✅ Saved {len(df)} rows, {len(df.columns)} features")

    except Exception as e:
        print(f"  ❌ Error: {e}")

print("\n✅ Done! Improved data saved to data_improved/")
print(f"   Features per stock: Close, Volume, High, Low, Open,")
print(f"   RSI, MACD, Bollinger Bands, SMAs, EMAs,")
print(f"   Volume ratio, Momentum, Daily change, HL range")