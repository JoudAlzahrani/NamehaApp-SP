import yfinance as yf
import pandas as pd
import os

# Create a folder to store the data
os.makedirs("data", exist_ok=True)

# Saudi stocks we want to train on
stocks = {
    "2222": "Saudi Aramco",
    "2010": "SABIC",
    "1120": "Al Rajhi Bank",
    "7010": "STC",
    "4002": "Mouwasat",
    "1180": "Al Jazira Bank",
    "2380": "Petro Rabigh",
    "4300": "Dar Al Arkan",
    "1211": "Maaden",
    "2350": "Saudi Kayan",
    "4001": "Saudi Pharmaceutical",
    "1050": "Banque Saudi Fransi",
    "1080": "Arab National Bank",
    "2290": "Yanbu National",
    "4030": "Tabuk Agriculture",
    "2160": "Rabigh Refining",
    "4040": "Saudi Airlines Catering",
    "1010": "Riyad Bank",
    "1030": "Saudi Investment Bank",
    "3010": "Saudi Basic Industries"
}

print("Downloading historical data...\n")

for ticker, name in stocks.items():
    symbol = f"{ticker}.SR"
    print(f"Downloading {name} ({symbol})...")

    try:
        df = yf.download(
            symbol,
            start="2010-01-01",
            end="2024-12-31",
            progress=False
        )

        if df.empty:
            print(f"  ⚠️  No data found for {symbol}, skipping")
            continue

        # Save to CSV
        filename = f"data/{ticker}.csv"
        df.to_csv(filename)
        print(f"  ✅ Saved {len(df)} rows to {filename}")

    except Exception as e:
        print(f"  ❌ Error downloading {symbol}: {e}")

print("\nDone! All data saved to the data/ folder.")