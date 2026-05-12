import pandas as pd
import numpy as np
import os
import ta

os.makedirs("data_us_improved", exist_ok=True)

us_stocks = [
    "AAPL", "MSFT", "TSLA", "AMZN", "GOOGL",
    "NVDA", "META", "JPM", "BAC", "XOM",
    "GS", "WMT", "JNJ", "V", "PG",
    "MA", "HD", "CVX", "ABBV", "KO"
]

print("Building improved US dataset with technical indicators...\n")

for ticker in us_stocks:
    path = f"data_us/{ticker}.csv"

    if not os.path.exists(path):
        print(f"  ⚠️  {ticker}: file not found, skipping")
        continue

    try:
        df = pd.read_csv(path, header=[0,1], index_col=0)

        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [col[0] for col in df.columns]

        df = df[["Close", "Volume", "High", "Low", "Open"]].copy()
        df = df.dropna()

        df["rsi"] = ta.momentum.RSIIndicator(
            close=df["Close"], window=14
        ).rsi()

        macd = ta.trend.MACD(close=df["Close"])
        df["macd"]        = macd.macd()
        df["macd_signal"] = macd.macd_signal()
        df["macd_diff"]   = macd.macd_diff()

        bb = ta.volatility.BollingerBands(close=df["Close"])
        df["bb_high"]  = bb.bollinger_hband()
        df["bb_low"]   = bb.bollinger_lband()
        df["bb_width"] = bb.bollinger_wband()

        df["sma_7"]  = df["Close"].rolling(7).mean()
        df["sma_21"] = df["Close"].rolling(21).mean()
        df["sma_50"] = df["Close"].rolling(50).mean()

        df["ema_12"] = df["Close"].ewm(span=12).mean()
        df["ema_26"] = df["Close"].ewm(span=26).mean()

        df["volume_sma"]   = df["Volume"].rolling(20).mean()
        df["volume_ratio"] = df["Volume"] / df["volume_sma"]

        df["momentum_5"]  = df["Close"].pct_change(5)
        df["momentum_10"] = df["Close"].pct_change(10)
        df["momentum_20"] = df["Close"].pct_change(20)

        df["change_pct"] = df["Close"].pct_change()
        df["hl_range"]   = (df["High"] - df["Low"]) / df["Close"]

        df = df.dropna()
        df.to_csv(f"data_us_improved/{ticker}.csv")
        print(f"  ✅ {ticker}: {len(df)} rows, {len(df.columns)} features")

    except Exception as e:
        print(f"  ❌ {ticker}: error — {e}")

print("\n✅ Done! Improved US data saved to data_us_improved/")