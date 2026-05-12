import time
import numpy as np
from services.finnhub_service import get_candles

SEQ_LEN   = 20
DAYS_BACK = 365
THRESHOLD = 0.01


def build_dataset(symbols, days=DAYS_BACK, seq_len=SEQ_LEN, threshold=THRESHOLD):
    all_X, all_y = [], []
    for symbol in symbols:
        print(f"  جاري جلب بيانات {symbol}...")
        try:
            X_sym, y_sym = _build_single(symbol, days, seq_len, threshold)
            if len(X_sym) > 0:
                all_X.append(X_sym)
                all_y.append(y_sym)
                print(f"   {symbol}: {len(X_sym)} sequence")
            else:
                print(f"    {symbol}: بيانات غير كافية")
        except Exception as e:
            print(f"   {symbol}: {e}")
        time.sleep(0.5)

    if not all_X:
        raise ValueError("لم يتم جمع أي بيانات!")

    X = np.concatenate(all_X, axis=0)
    y = np.concatenate(all_y, axis=0)
    print(f"\n Dataset: {X.shape[0]} samples | BUY={int(y.sum())} | SELL={int((1-y).sum())}")
    return X, y


def build_single_sequence(symbol, seq_len=SEQ_LEN):
    """يبني sequence واحدة للـ inference."""
    try:
        candles  = get_candles(symbol, resolution="D", days=seq_len + 5)
        features = _extract_features(candles)
        if len(features) < seq_len:
            return None
        seq = np.array(features[-seq_len:], dtype=np.float32)
        seq = _normalize(seq)
        return seq.reshape(1, seq_len, seq.shape[1])
    except Exception:
        return None


def _build_single(symbol, days, seq_len, threshold):
    candles  = get_candles(symbol, resolution="D", days=days)
    features = _extract_features(candles)
    if len(features) < seq_len + 1:
        return np.array([]), np.array([])

    feat_arr = np.array(features, dtype=np.float32)
    closes   = np.array(candles.get("c", []), dtype=np.float32)
    X_list, y_list = [], []

    for i in range(seq_len, len(feat_arr)):
        seq = _normalize(feat_arr[i - seq_len: i])
        if i < len(closes) and closes[i - 1]:
            future_return = (closes[i] - closes[i - 1]) / closes[i - 1]
            label = 1 if future_return > threshold else 0
            X_list.append(seq)
            y_list.append(label)

    return np.array(X_list), np.array(y_list)


def _extract_features(candles):
    """6 features لكل يوم: [close, high, low, volume, return_1d, hl_range]"""
    closes  = candles.get("c", [])
    highs   = candles.get("h", [])
    lows    = candles.get("l", [])
    volumes = candles.get("v", [])

    if not closes or len(closes) < 2:
        return []

    rows = []
    for i in range(1, len(closes)):
        c        = closes[i]
        h        = highs[i]   if i < len(highs)   else c
        l        = lows[i]    if i < len(lows)     else c
        v        = volumes[i] if i < len(volumes)  else 0.0
        ret      = (c - closes[i-1]) / closes[i-1] if closes[i-1] else 0.0
        hl_range = (h - l) / c if c else 0.0
        rows.append([c, h, l, v, ret, hl_range])
    return rows


def _normalize(seq):
    result = np.zeros_like(seq)
    for j in range(seq.shape[1]):
        col = seq[:, j]
        mn, mx = col.min(), col.max()
        result[:, j] = (col - mn) / (mx - mn) if (mx - mn) > 1e-8 else 0.0
    return result