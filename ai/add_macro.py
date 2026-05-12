import pandas as pd
import numpy as np
import yfinance as yf
import os

DATA_FOLDER = "data_improved"

# ── MACRO INDICATORS ──────────────────────────────────────────────
# These are market-wide signals that affect all Saudi stocks

print("Fetching macroeconomic indicators...\n")

# 1. Oil price (Brent crude) — Saudi market is heavily oil-dependent
oil = yf.download("BZ=F", start="2010-01-01", end="2024-12-31", progress=False)
if isinstance(oil.columns, pd.MultiIndex):
    oil.columns = [col[0] for col in oil.columns]
oil = oil[["Close"]].rename(columns={"Close": "oil_price"})
oil["oil_change"] = oil["oil_price"].pct_change()
oil["oil_sma20"]  = oil["oil_price"].rolling(20).mean()
print(f"✅ Oil price: {len(oil)} rows")

# 2. USD/SAR exchange rate — affects foreign investment
try:
    fx = yf.download("SAR=X", start="2010-01-01", end="2024-12-31", progress=False)
    if isinstance(fx.columns, pd.MultiIndex):
        fx.columns = [col[0] for col in fx.columns]
    fx = fx[["Close"]].rename(columns={"Close": "usd_sar"})
    fx["fx_change"] = fx["usd_sar"].pct_change()
    print(f"✅ USD/SAR rate: {len(fx)} rows")
except:
    fx = None
    print("⚠️  USD/SAR not available, skipping")

# 3. TASI index (Saudi market index) — overall market direction
tasi = yf.download("^TASI.SR", start="2010-01-01", end="2024-12-31", progress=False)
if isinstance(tasi.columns, pd.MultiIndex):
    tasi.columns = [col[0] for col in tasi.columns]
if not tasi.empty:
    tasi = tasi[["Close"]].rename(columns={"Close": "tasi"})
    tasi["tasi_change"] = tasi["tasi"].pct_change()
    tasi["tasi_sma20"]  = tasi["tasi"].rolling(20).mean()
    print(f"✅ TASI index: {len(tasi)} rows")
else:
    tasi = None
    print("⚠️  TASI not available, skipping")

# ── MERGE WITH EACH STOCK ─────────────────────────────────────────

csv_files = [f for f in os.listdir(DATA_FOLDER) if f.endswith(".csv")]
print(f"\nAdding macro features to {len(csv_files)} stocks...\n")

for filename in csv_files:
    ticker = filename.replace(".csv", "")
    path   = os.path.join(DATA_FOLDER, filename)

    try:
        df = pd.read_csv(path, index_col=0)
        df.index = pd.to_datetime(df.index)

        original_cols = len(df.columns)

        # Merge oil price
        oil.index = pd.to_datetime(oil.index)
        df = df.join(oil, how="left")

        # Merge FX rate
        if fx is not None:
            fx.index = pd.to_datetime(fx.index)
            df = df.join(fx, how="left")

        # Merge TASI
        if tasi is not None:
            tasi.index = pd.to_datetime(tasi.index)
            df = df.join(tasi, how="left")

        # Forward fill any missing macro values
        df = df.ffill().dropna()

        # Save back
        df.to_csv(path)
        print(f"  ✅ {ticker}: {original_cols} → {len(df.columns)} features, {len(df)} rows")

    except Exception as e:
        print(f"  ❌ {ticker}: error — {e}")

print(f"\n✅ Done! Macro features added to all stocks in {DATA_FOLDER}/")
print(f"   New features: oil_price, oil_change, oil_sma20, usd_sar, fx_change, tasi, tasi_change, tasi_sma20")