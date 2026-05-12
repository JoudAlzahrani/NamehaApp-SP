from datetime import datetime, timezone, timedelta

RIYADH_TZ = timezone(timedelta(hours=3))
EASTERN_TZ = timezone(timedelta(hours=-4))  # EDT (يتغير لـ -5 شتاء)

SAUDI_SYMBOLS = {
    "2222", "2010", "1120", "1180", "1150", "7010", "7020", "7030", "7040",
    "4002", "4004", "4020", "2060", "2082", "4030", "2380", "4300",
    "2030", "1180",
}


def _is_saudi(symbol: str) -> bool:
    return symbol.strip().upper() in SAUDI_SYMBOLS


def is_market_open(symbol: str) -> tuple[bool, str]:
    """
    يرجع (True, "") لو السوق مفتوح،
    أو (False, "رسالة سبب الإغلاق") لو مقفل.
    """
    symbol = symbol.strip().upper()

    if _is_saudi(symbol):
        return _check_saudi()
    return _check_us()


def _check_saudi() -> tuple[bool, str]:
    now = datetime.now(RIYADH_TZ)
    # الأيام: الأحد=6، الاثنين=0، الثلاثاء=1، الأربعاء=2، الخميس=3
    trading_days = {0, 1, 2, 3, 6}

    if now.weekday() not in trading_days:
        return False, "السوق السعودي مغلق اليوم (يفتح الأحد - الخميس)"

    minutes = now.hour * 60 + now.minute
    # التداول: 10:00 - 15:00 بتوقيت الرياض
    if minutes < 10 * 60:
        return False, "السوق السعودي لم يفتح بعد (يفتح 10:00 ص)"
    if minutes >= 15 * 60:
        return False, "السوق السعودي أغلق (يغلق 3:00 م)"

    return True, ""


def _check_us() -> tuple[bool, str]:
    now = datetime.now(EASTERN_TZ)
    # الأيام: الاثنين=0 .. الجمعة=4
    if now.weekday() > 4:
        return False, "السوق الأمريكي مغلق اليوم (يفتح الاثنين - الجمعة)"

    minutes = now.hour * 60 + now.minute
    # التداول: 9:30 - 16:00 بتوقيت الشرقي
    if minutes < 9 * 60 + 30:
        return False, "السوق الأمريكي لم يفتح بعد (يفتح 9:30 ص)"
    if minutes >= 16 * 60:
        return False, "السوق الأمريكي أغلق (يغلق 4:00 م)"

    return True, ""
