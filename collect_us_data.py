import yfinance as yf
import pandas as pd
import os

os.makedirs("data_us", exist_ok=True)

us_stocks = {
    "AAPL":  "Apple",
    "MSFT":  "Microsoft",
    "TSLA":  "Tesla",
    "AMZN":  "Amazon",
    "GOOGL": "Google",
    "NVDA":  "Nvidia",
    "META":  "Meta",
    "JPM":   "JPMorgan",
    "BAC":   "Bank of America",
    "XOM":   "ExxonMobil",
    "GS":    "Goldman Sachs",
    "WMT":   "Walmart",
    "JNJ":   "Johnson & Johnson",
    "V":     "Visa",
    "PG":    "Procter & Gamble",
    "MA":    "Mastercard",
    "HD":    "Home Depot",
    "CVX":   "Chevron",
    "ABBV":  "AbbVie",
    "KO":    "Coca Cola"
}

print("Downloading US stock data...\n")

for ticker, name in us_stocks.items():
    print(f"Downloading {name} ({ticker})...")
    try:
        df = yf.download(
            ticker,
            start="2010-01-01",
            end="2024-12-31",
            progress=False
        )
        if df.empty:
            print(f"  ⚠️  No data found for {ticker}, skipping")
            continue
        df.to_csv(f"data_us/{ticker}.csv")
        print(f"  ✅ Saved {len(df)} rows")
    except Exception as e:
        print(f"  ❌ Error: {e}")

print("\n✅ Done! US data saved to data_us/")