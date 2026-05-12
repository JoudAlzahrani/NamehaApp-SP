import pandas as pd
import numpy as np
import yfinance as yf
import os

DATA_FOLDER = "data_us_improved"

print("Fetching US macroeconomic indicators...\n")

# S&P 500
sp500 = yf.download("^GSPC", start="2010-01-01", end="2024-12-31", progress=False)
if isinstance(sp500.columns, pd.MultiIndex):
    sp500.columns = [col[0] for col in sp500.columns]
sp500 = sp500[["Close"]].rename(columns={"Close": "sp500"})
sp500["sp500_change"] = sp500["sp500"].pct_change()
sp500["sp500_sma20"]  = sp500["sp500"].rolling(20).mean()
print(f"✅ S&P 500: {len(sp500)} rows")

# VIX
vix = yf.download("^VIX", start="2010-01-01", end="2024-12-31", progress=False)
if isinstance(vix.columns, pd.MultiIndex):
    vix.columns = [col[0] for col in vix.columns]
vix = vix[["Close"]].rename(columns={"Close": "vix"})
vix["vix_change"] = vix["vix"].pct_change()
print(f"✅ VIX: {len(vix)} rows")

# Treasury
try:
    treasury = yf.download("^TNX", start="2010-01-01", end="2024-12-31", progress=False)
    if isinstance(treasury.columns, pd.MultiIndex):
        treasury.columns = [col[0] for col in treasury.columns]
    treasury = treasury[["Close"]].rename(columns={"Close": "treasury_10y"})
    treasury["treasury_change"] = treasury["treasury_10y"].pct_change()
    print(f"✅ 10Y Treasury: {len(treasury)} rows")
except:
    treasury = None
    print("⚠️  Treasury not available, skipping")

# Oil
oil = yf.download("BZ=F", start="2010-01-01", end="2024-12-31", progress=False)
if isinstance(oil.columns, pd.MultiIndex):
    oil.columns = [col[0] for col in oil.columns]
oil = oil[["Close"]].rename(columns={"Close": "oil_price"})
oil["oil_change"] = oil["oil_price"].pct_change()
print(f"✅ Oil price: {len(oil)} rows")

# Merge with each stock
csv_files = [f for f in os.listdir(DATA_FOLDER) if f.endswith(".csv")]
print(f"\nAdding macro features to {len(csv_files)} US stocks...\n")

for filename in csv_files:
    ticker = filename.replace(".csv", "")
    path   = os.path.join(DATA_FOLDER, filename)

    try:
        df = pd.read_csv(path, index_col=0)
        df.index = pd.to_datetime(df.index)
        original_cols = len(df.columns)

        for macro_df in [sp500, vix, oil]:
            macro_df.index = pd.to_datetime(macro_df.index)
            df = df.join(macro_df, how="left")

        if treasury is not None:
            treasury.index = pd.to_datetime(treasury.index)
            df = df.join(treasury, how="left")

        df = df.ffill().dropna()
        df.to_csv(path)

        print(f"  ✅ {ticker}: {original_cols} → {len(df.columns)} features, "
              f"{len(df)} rows")

    except Exception as e:
        print(f"  ❌ {ticker}: error — {e}")

print(f"\n✅ Done! US macro features added")