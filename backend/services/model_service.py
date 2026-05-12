"""
model_service.py
----------------
خدمة التنبؤ بالاتجاه والثقة.
حالياً: محاكاة منطقية بناءً على momentum (MVP).
لاحقاً: يتحول لنموذج LSTM حقيقي.
"""


def predict_direction_and_confidence(features: dict) -> dict:
    """
    يأخذ features السهم ويرجع direction و confidence.

    Parameters
    ----------
    features : dict
        يجب أن يحتوي على:
        - momentum_1d : float | None  (نسبة التغير اليومي)
        - current_price : float | None
        - prev_close : float | None

    Returns
    -------
    dict  {"direction": "BUY"|"SELL", "confidence": float, "reason_ar": str}
    """
    momentum = features.get("momentum_1d")
    current = features.get("current_price")
    prev = features.get("prev_close")

    # إذا ما عندنا بيانات كافية - افتراضي
    if momentum is None or current is None or prev is None:
        return {
            "direction": "HOLD",
            "confidence": 0.50,
            "reason_ar": "بيانات غير كافية للتحليل.",
        }

    # منطق بسيط للـ MVP
    if momentum > 0.02:
        direction = "BUY"
        confidence = min(0.55 + momentum * 5, 0.90)
        reason = f"السهم ارتفع {momentum*100:.1f}% اليوم — زخم إيجابي."
    elif momentum < -0.02:
        direction = "SELL"
        confidence = min(0.55 + abs(momentum) * 5, 0.90)
        reason = f"السهم انخفض {abs(momentum)*100:.1f}% اليوم — ضغط بيعي."
    else:
        direction = "HOLD"
        confidence = 0.52
        reason = f"تحرك محدود ({momentum*100:.2f}%) — لا توصية واضحة."

    return {
        "direction": direction,
        "confidence": round(confidence, 2),
        "reason_ar": reason,
    }
