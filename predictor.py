import numpy as np
import pandas as pd
import yfinance as yf
import os
import pickle
import warnings
warnings.filterwarnings("ignore")

import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

SEQUENCE_LENGTH = 30

FEATURE_NAMES = [
    "Close", "Volume", "High", "Low", "Open",
    "rsi",
    "macd", "macd_signal", "macd_diff",
    "bb_high", "bb_low", "bb_width",
    "sma_7", "sma_21", "sma_50",
    "ema_12", "ema_26",
    "volume_sma", "volume_ratio",
    "momentum_5", "momentum_10", "momentum_20",
    "change_pct", "hl_range",
    # Macro features (8 إضافية عشان نوصل 32)
    "oil_price", "oil_change", "oil_sma20",
    "usd_sar", "fx_change",
    "tasi", "tasi_change", "tasi_sma20",
]

LSTM_FEATURES_SA = 32  # Saudi LSTM
LSTM_FEATURES_US = 33  # US LSTM

# ── LOAD ALL 3 MODELS ─────────────────────────────────────────────

_DIR = os.path.dirname(os.path.abspath(__file__))

print("Loading models...")

saudi_model = tf.keras.models.load_model(os.path.join(_DIR, "model/lstm_nameha.keras"))
us_model    = tf.keras.models.load_model(os.path.join(_DIR, "model/lstm_us.keras"))
print("✅ LSTM Saudi loaded (55.85%)")
print("✅ LSTM US loaded (52.77%)")

with open(os.path.join(_DIR, "model/xgboost_nameha.pkl"), "rb") as f:
    xgb_model = pickle.load(f)
print("✅ XGBoost loaded (68.71%)")

with open(os.path.join(_DIR, "model/random_forest_nameha.pkl"), "rb") as f:
    rf_model = pickle.load(f)
print("✅ Random Forest loaded (62.11%)")

print("\n🎯 Ensemble ready — 3 models combined\n")


# ── MACRO DATA ────────────────────────────────────────────────────

def get_macro_features(index):
    """يجيب الـ macro features من yfinance"""
    try:
        # Oil price
        oil = yf.Ticker("BZ=F").history(period="90d")["Close"]
        oil = oil.reindex(index).ffill().bfill().fillna(75)
        oil_price = oil.values
        oil_change = pd.Series(oil_price).pct_change().fillna(0).values
        oil_sma20 = pd.Series(oil_price).rolling(20).mean().fillna(oil_price[0]).values

        # USD/SAR
        fx = yf.Ticker("SAR=X").history(period="90d")["Close"]
        fx = fx.reindex(index).ffill().bfill().fillna(3.75)
        usd_sar = fx.values
        fx_change = pd.Series(usd_sar).pct_change().fillna(0).values

        # TASI
        tasi = yf.Ticker("^TASI.SR").history(period="90d")["Close"]
        tasi = tasi.reindex(index).ffill().bfill()
        if tasi.isna().all():
            tasi_vals = np.ones(len(index)) * 10000
        else:
            tasi_vals = tasi.fillna(tasi.mean()).values
        tasi_change = pd.Series(tasi_vals).pct_change().fillna(0).values
        tasi_sma20 = pd.Series(tasi_vals).rolling(20).mean().fillna(tasi_vals[0]).values

        return {
            "oil_price": oil_price,
            "oil_change": oil_change,
            "oil_sma20": oil_sma20,
            "usd_sar": usd_sar,
            "fx_change": fx_change,
            "tasi": tasi_vals,
            "tasi_change": tasi_change,
            "tasi_sma20": tasi_sma20,
        }
    except Exception as e:
        print(f"  Macro fetch error (using defaults): {e}")
        n = len(index)
        return {
            "oil_price": np.ones(n) * 75,
            "oil_change": np.zeros(n),
            "oil_sma20": np.ones(n) * 75,
            "usd_sar": np.ones(n) * 3.75,
            "fx_change": np.zeros(n),
            "tasi": np.ones(n) * 10000,
            "tasi_change": np.zeros(n),
            "tasi_sma20": np.ones(n) * 10000,
        }


# ── DATA FETCHING ─────────────────────────────────────────────────

def get_stock_features(ticker: str, market: str = "SA"):
    lstm_features = LSTM_FEATURES_US if market == "US" else LSTM_FEATURES_SA
    """Downloads recent data and calculates all features"""
    try:
        import ta
    except ImportError:
        raise ImportError("Run: pip install ta")

    symbol = ticker if market == "US" else f"{ticker}.SR"
    stock  = yf.Ticker(symbol)
    hist   = stock.history(period="90d")

    if hist.empty or len(hist) < SEQUENCE_LENGTH + 30:
        return None, None, None, None

    df = hist[["Close", "Volume", "High", "Low", "Open"]].copy()

    df["rsi"] = ta.momentum.RSIIndicator(close=df["Close"], window=14).rsi()

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

    # Macro features
    macro = get_macro_features(df.index)
    for key, values in macro.items():
        if len(values) == len(df):
            df[key] = values
        else:
            df[key] = values[:len(df)] if len(values) > len(df) else np.pad(values, (0, len(df) - len(values)), constant_values=values[-1] if len(values) > 0 else 0)

    df = df.dropna()

    if len(df) < SEQUENCE_LENGTH:
        return None, None, None, None

    # نستخدم الـ features المتاحة بس نضمن نوصل 32
    available = [f for f in FEATURE_NAMES if f in df.columns]
    df_features = df[available]

    close_prices = df["Close"].values
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(df_features)

    # Pad لـ lstm_features إذا ناقص
    if scaled.shape[1] < lstm_features:
        padding = np.zeros((scaled.shape[0], lstm_features - scaled.shape[1]))
        scaled_padded = np.hstack([scaled, padding])
    else:
        scaled_padded = scaled[:, :lstm_features]

    X_3d = scaled_padded[-SEQUENCE_LENGTH:].reshape(1, SEQUENCE_LENGTH, lstm_features)

    # Flat للـ XGBoost (990)
    window = scaled[-SEQUENCE_LENGTH:]
    flat_raw = window.flatten()
    xgb_expected = 990
    if len(flat_raw) < xgb_expected:
        flat_raw = np.pad(flat_raw, (0, xgb_expected - len(flat_raw)))
    else:
        flat_raw = flat_raw[:xgb_expected]
    X_flat = flat_raw.reshape(1, -1)

    return X_3d, X_flat, close_prices, available


# ── EXPLAINABILITY ────────────────────────────────────────────────

def get_explanation(ticker: str, direction: str, close_prices, market: str = "SA"):
    try:
        symbol = ticker if market == "US" else f"{ticker}.SR"
        stock  = yf.Ticker(symbol)
        hist   = stock.history(period="60d")

        if hist.empty:
            raise ValueError("No data")

        close  = hist["Close"].values
        volume = hist["Volume"].values

        price_14d_change = ((close[-1] - close[-14]) / close[-14]) * 100
        consecutive_up   = 0
        for i in range(len(close) - 1, 0, -1):
            if close[i] > close[i - 1]:
                consecutive_up += 1
            else:
                break

        price_importance = round(abs(price_14d_change) / 100, 4)
        if price_14d_change > 0:
            price_label = f"Rising steadily for {consecutive_up} days (+{price_14d_change:.1f}% over 14 days)"
        else:
            price_label = f"Declining recently ({price_14d_change:.1f}% over 14 days)"

        avg_volume    = volume[-30:].mean()
        recent_volume = volume[-3:].mean()
        volume_ratio  = recent_volume / avg_volume if avg_volume > 0 else 1.0
        volume_importance = round(abs(volume_ratio - 1.0), 4)

        if volume_ratio > 1.5:
            volume_label = f"{volume_ratio:.1f}x more trades than usual — strong buyer interest"
        elif volume_ratio > 1.1:
            volume_label = "Slightly above average trading activity"
        elif volume_ratio < 0.7:
            volume_label = "Below average trading — low interest right now"
        else:
            volume_label = "Normal trading activity this week"

        daily_changes   = np.diff(close[-14:]) / close[-14:-1]
        volatility      = float(np.std(daily_changes))
        stab_importance = round(volatility, 4)

        if volatility < 0.01:
            stability_label = "Calm — very few sudden price changes"
        elif volatility < 0.02:
            stability_label = "Moderate — some normal fluctuation"
        else:
            stability_label = "High volatility — larger than usual swings"

        gains    = [max(0, close[i] - close[i-1]) for i in range(-14, 0)]
        losses   = [max(0, close[i-1] - close[i]) for i in range(-14, 0)]
        avg_gain = np.mean(gains) if gains else 0
        avg_loss = np.mean(losses) if losses else 0.001
        rsi      = 100 - (100 / (1 + avg_gain / avg_loss))
        rsi_importance = round(abs(rsi - 50) / 100, 4)

        if rsi > 70:
            rsi_label = "Likely to stay flat or pull back slightly"
        elif rsi < 30:
            rsi_label = "Likely to recover — oversold signal"
        elif rsi > 55:
            rsi_label = "Likely to continue rising — positive momentum"
        elif rsi < 45:
            rsi_label = "Likely to stay flat or continue falling"
        else:
            rsi_label = "Likely to stay flat or continue current trend"

        all_factors = [
            ("Price direction",      price_importance,  price_label),
            ("Investor activity",    volume_importance, volume_label),
            ("Price swings",         stab_importance,   stability_label),
            ("Short-term direction", rsi_importance,    rsi_label)
        ]
        ranked = sorted(all_factors, key=lambda x: x[1], reverse=True)

        return [
            {"feature": name, "label": name, "importance": importance, "detail": detail}
            for name, importance, detail in ranked[:3]
        ]

    except Exception as e:
        print(f"  Explainer error: {e}")
        return [
            {"feature": "price_trend", "label": "Price direction",    "importance": 0.0, "detail": "Price data unavailable"},
            {"feature": "volume",      "label": "Investor activity",  "importance": 0.0, "detail": "Volume data unavailable"},
            {"feature": "momentum",    "label": "Short-term direction","importance": 0.0, "detail": "Momentum data unavailable"}
        ]


# ── ENSEMBLE PREDICTION ───────────────────────────────────────────

def ensemble_predict(X_3d, X_flat, market: str = "SA"):
    active_lstm   = us_model if market == "US" else saudi_model
    lstm_prob     = float(active_lstm.predict(X_3d, verbose=0)[0][0])
    xgb_prob      = float(xgb_model.predict_proba(X_flat)[0][1])
    rf_prob       = float(rf_model.predict_proba(X_flat)[0][1])
    ensemble_prob = (lstm_prob + xgb_prob + rf_prob) / 3
    direction     = "up" if ensemble_prob > 0.5 else "down"
    confidence    = ensemble_prob if ensemble_prob > 0.5 else 1 - ensemble_prob

    return {
        "ensemble_prob": round(ensemble_prob, 4),
        "lstm_prob":     round(lstm_prob, 4),
        "xgb_prob":      round(xgb_prob, 4),
        "rf_prob":       round(rf_prob, 4),
        "direction":     direction,
        "confidence":    round(confidence, 2)
    }


# ── MAIN PREDICT FUNCTION ─────────────────────────────────────────

def predict(ticker: str, market: str = "SA"):
    print(f"  Fetching data for {ticker} ({market})...")
    result = get_stock_features(ticker, market)

    if result[0] is None:
        return {
            "ticker":              ticker,
            "market":              market,
            "predicted_direction": "unknown",
            "confidence_score":    0.5,
            "top_factors":         [],
            "error":               "Not enough data"
        }

    X_3d, X_flat, close_prices, feature_names = result

    print(f"  Running ensemble prediction (LSTM + XGBoost + RF)...")
    pred = ensemble_predict(X_3d, X_flat, market)

    print(f"    LSTM:          {pred['lstm_prob']:.3f}")
    print(f"    XGBoost:       {pred['xgb_prob']:.3f}")
    print(f"    Random Forest: {pred['rf_prob']:.3f}")
    print(f"    Ensemble avg:  {pred['ensemble_prob']:.3f} → {pred['direction'].upper()}")

    print(f"  Calculating explanation...")
    explanation_factors = get_explanation(ticker, pred["direction"], close_prices, market)

    top_factors = []
    for i, factor in enumerate(explanation_factors):
        impact = "positive" if (i == 0 and pred["direction"] == "up") else ("negative" if i == 0 else "neutral")
        top_factors.append({"factor": factor["label"], "impact": impact, "detail": factor["detail"]})

    recent_prices = close_prices[-14:]
    price_change  = round(((recent_prices[-1] - recent_prices[0]) / recent_prices[0]) * 100, 2)

    consecutive = 0
    for i in range(len(recent_prices) - 1, 0, -1):
        if recent_prices[i] > recent_prices[i - 1]:
            consecutive += 1
        else:
            break

    return {
        "ticker":               ticker,
        "market":               market,
        "predicted_direction":  pred["direction"],
        "confidence_score":     pred["confidence"],
        "ensemble_breakdown": {
            "lstm":          pred["lstm_prob"],
            "xgboost":       pred["xgb_prob"],
            "random_forest": pred["rf_prob"],
            "average":       pred["ensemble_prob"]
        },
        "price_change_14d":    price_change,
        "consecutive_up_days": consecutive,
        "top_factors":         top_factors
    }


if __name__ == "__main__":
    print("=== Testing ===\n")
    result = predict("2222", market="SA")
    print(result)
