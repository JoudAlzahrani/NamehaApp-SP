from groq import Groq
from dotenv import load_dotenv
import os
import json
import yfinance as yf
from datetime import datetime

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── TOOL FUNCTIONS ────────────────────────────────────────────────

def get_user_portfolio(user_id):
    """
    Returns user's portfolio with purchase prices.
    Replace with real DB in Phase 3.
    """
    return {
        "user_id": user_id,
        "risk_profile": "medium",
        "max_loss_threshold_pct": 10,
        "holdings": [
            {
                "ticker": "2010",
                "name": "SABIC",
                "shares": 50,
                "purchase_price_sar": 60.00,
                "purchase_value_sar": 3000.00
            },
            {
                "ticker": "2222",
                "name": "Saudi Aramco",
                "shares": 100,
                "purchase_price_sar": 30.00,
                "purchase_value_sar": 3000.00
            },
            {
                "ticker": "1120",
                "name": "Al Rajhi Bank",
                "shares": 30,
                "purchase_price_sar": 85.00,
                "purchase_value_sar": 2550.00
            }
        ]
    }


def get_current_price(ticker):
    """Fetches the real current price from Yahoo Finance"""
    try:
        symbol = f"{ticker}.SR"
        stock  = yf.Ticker(symbol)
        hist   = stock.history(period="2d")

        if hist.empty:
            return {"error": f"No data for {symbol}"}

        current_price = round(float(hist["Close"].iloc[-1]), 2)
        prev_price    = round(float(hist["Close"].iloc[-2]), 2)
        change_pct    = round(((current_price - prev_price) / prev_price) * 100, 2)

        return {
            "ticker": ticker,
            "current_price": current_price,
            "previous_close": prev_price,
            "change_today_pct": change_pct
        }

    except Exception as e:
        return {"error": str(e)}


def calculate_portfolio_health(user_id):
    """
    Calculates current gain/loss for each holding.
    Flags any that are approaching or breaching the loss threshold.
    """
    portfolio  = get_user_portfolio(user_id)
    threshold  = portfolio["max_loss_threshold_pct"]
    holdings   = portfolio["holdings"]
    alerts     = []
    healthy    = []

    for holding in holdings:
        price_data = get_current_price(holding["ticker"])

        if "error" in price_data:
            continue

        current_price   = price_data["current_price"]
        purchase_price  = holding["purchase_price_sar"]
        shares          = holding["shares"]

        current_value   = round(current_price * shares, 2)
        purchase_value  = holding["purchase_value_sar"]
        loss_pct        = round(((purchase_value - current_value) / purchase_value) * 100, 2)
        gain_pct        = -loss_pct  # positive = gain, negative = loss

        holding_status = {
            "ticker":          holding["ticker"],
            "name":            holding["name"],
            "shares":          shares,
            "purchase_price":  purchase_price,
            "current_price":   current_price,
            "purchase_value":  purchase_value,
            "current_value":   current_value,
            "gain_loss_pct":   gain_pct,
            "threshold_pct":   threshold
        }

        # Flag if loss is 80% of threshold or more
        if loss_pct >= threshold * 0.8:
            holding_status["status"]  = "alert"
            holding_status["message"] = (
                f"Loss of {loss_pct}% is approaching your {threshold}% limit"
                if loss_pct < threshold
                else f"Loss of {loss_pct}% has exceeded your {threshold}% limit"
            )
            alerts.append(holding_status)
        else:
            holding_status["status"] = "healthy"
            healthy.append(holding_status)

    return {
        "user_id":          user_id,
        "threshold_pct":    threshold,
        "total_holdings":   len(holdings),
        "alerts":           alerts,
        "healthy":          healthy,
        "checked_at":       datetime.now().strftime("%Y-%m-%d %H:%M")
    }


def generate_alert_suggestion(holding_data):
    """
    Asks the AI to generate a plain-English suggestion for a flagged holding.
    This is the only tool the AI calls in the risk monitor.
    """
    return holding_data


# ── TOOLS DEFINITION ──────────────────────────────────────────────

tools_definition = [
    {
        "type": "function",
        "function": {
            "name": "calculate_portfolio_health",
            "description": "Checks all holdings in the user's portfolio and returns any that are approaching or exceeding the loss threshold",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"}
                },
                "required": ["user_id"]
            }
        }
    }
]

available_tools = {
    "calculate_portfolio_health": calculate_portfolio_health
}


# ── SYSTEM PROMPT ─────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are Nameha's risk monitoring AI for beginner investors in Saudi Arabia.

Your job:
1. Call calculate_portfolio_health to check the user's portfolio
2. If there are alerts, generate a clear friendly message for each one
3. Return ONLY a JSON object — no markdown, no extra text

Return exactly this structure:
{
  "has_alerts": true or false,
  "checked_at": "2024-01-15 14:30",
  "portfolio_summary": "one sentence about the overall portfolio health",
  "alerts": [
    {
      "ticker": "2010",
      "name": "SABIC",
      "status": "warning or critical",
      "gain_loss_pct": -8.5,
      "current_value": 2745.0,
      "purchase_value": 3000.0,
      "message": "one plain sentence explaining the situation to a beginner",
      "suggestions": [
        "option 1 — short plain sentence e.g. Hold and wait for recovery",
        "option 2 — short plain sentence e.g. Sell now to limit further loss",
        "option 3 — short plain sentence e.g. Buy more at the lower price"
      ]
    }
  ],
  "healthy_holdings": [
    {
      "ticker": "2222",
      "name": "Saudi Aramco",
      "gain_loss_pct": 5.2,
      "status": "healthy"
    }
  ]
}

Status rules:
- warning: loss is between 80% and 100% of the threshold
- critical: loss has exceeded the threshold

Always use simple beginner-friendly language.
Never automatically suggest selling — always present options and let the user decide.
Remind the user that the final decision is always theirs.
"""


# ── AGENT LOOP ────────────────────────────────────────────────────

def run_agent(messages):
    max_iterations = 6
    iteration = 0

    while iteration < max_iterations:
        iteration += 1

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                tools=tools_definition,
                tool_choice="auto",
                max_tokens=2048
            )
        except Exception as e:
            print(f"  API error: {e}")
            print("  Retrying without tools...")
            messages.append({
                "role": "user",
                "content": "Based on the data so far, return the risk monitoring result as JSON."
            })
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=2048
            )
            return response.choices[0].message.content

        msg = response.choices[0].message

        if not msg.tool_calls:
            return msg.content

        messages.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                }
                for tc in msg.tool_calls
            ]
        })

        for tc in msg.tool_calls:
            tool_name = tc.function.name

            try:
                tool_input = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                tool_input = {}

            print(f"  → Calling: {tool_name}({tool_input})")

            result = available_tools[tool_name](**tool_input) \
                     if tool_name in available_tools \
                     else {"error": f"Unknown tool: {tool_name}"}

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result)
            })

    return '{"error": "max iterations reached"}'


# ── MAIN FUNCTION ─────────────────────────────────────────────────

def check_portfolio_risk(user_id: str):
    """
    Main function — runs the risk check for a user.
    In Phase 3 this gets called every hour by a scheduler.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Check the portfolio risk for user {user_id}. "
                       f"Identify any holdings approaching or exceeding "
                       f"the loss threshold and generate suggestions."
        }
    ]

    raw = run_agent(messages)

    try:
        clean  = raw.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        return {"success": True, "data": result}
    except json.JSONDecodeError:
        return {"success": False, "error": "Could not parse result", "raw": raw}


# ── TEST ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Running risk monitor for user_001...\n")

    result = check_portfolio_risk("user_001")

    if result["success"]:
        data = result["data"]

        print(f"Portfolio summary: {data['portfolio_summary']}")
        print(f"Has alerts: {data['has_alerts']}")
        print(f"Checked at: {data['checked_at']}")

        if data["has_alerts"]:
            print(f"\n⚠️  ALERTS ({len(data['alerts'])}):")
            for alert in data["alerts"]:
                print(f"\n  {alert['name']} ({alert['ticker']})")
                print(f"  Status: {alert['status'].upper()}")
                print(f"  Change: {alert['gain_loss_pct']}%")
                print(f"  Message: {alert['message']}")
                print(f"  Suggestions:")
                for s in alert["suggestions"]:
                    print(f"    • {s}")
        else:
            print("\n✅ All holdings are healthy")

        if data.get("healthy_holdings"):
            print(f"\n✅ HEALTHY HOLDINGS:")
            for h in data["healthy_holdings"]:
                print(f"  {h['name']}: {h['gain_loss_pct']}%")

    else:
        print("Error:", result["error"])
        print("Raw:", result.get("raw"))