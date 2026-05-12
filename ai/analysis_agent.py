from groq import Groq, RateLimitError
from dotenv import load_dotenv
import os
import json
import yfinance as yf
import numpy as np
from predictor import predict

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]

def _chat_with_fallback(messages, tools=None, tool_choice=None, max_tokens=2048):
    """Try each model in order, falling back on rate limit errors."""
    last_err = None
    for model in MODELS:
        try:
            kwargs = {"model": model, "messages": messages, "max_tokens": max_tokens}
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = tool_choice or "auto"
            resp = client.chat.completions.create(**kwargs)
            if model != MODELS[0]:
                print(f"  [fallback] using model: {model}")
            return resp
        except RateLimitError as e:
            print(f"  Rate limit on {model}: {e}")
            last_err = e
            continue
        except Exception as e:
            raise e
    raise last_err

# ── TOOL FUNCTIONS ────────────────────────────────────────────────

def get_stock_data(ticker, market="SA"):
    """Fetches real price data from Yahoo Finance"""
    symbol = ticker if market == "US" else f"{ticker}.SR"

    try:
        stock = yf.Ticker(symbol)
        hist  = stock.history(period="30d")

        if hist.empty:
            return {"error": f"No data found for {symbol}"}

        prices  = hist["Close"].tolist()
        volumes = hist["Volume"].tolist()

        # Consecutive up days
        consecutive_up = 0
        for i in range(len(prices) - 1, 0, -1):
            if prices[i] > prices[i - 1]:
                consecutive_up += 1
            else:
                break

        # Volatility
        changes = hist["Close"].pct_change().dropna()
        std     = changes.std()
        if std < 0.01:
            volatility = "low"
        elif std < 0.025:
            volatility = "medium"
        else:
            volatility = "high"

        # Volume ratio
        avg_volume   = sum(volumes[:-1]) / len(volumes[:-1]) if len(volumes) > 1 else 1
        volume_ratio = round(volumes[-1] / avg_volume, 2) if avg_volume > 0 else 1.0

        change_today = round(
            ((prices[-1] - prices[-2]) / prices[-2]) * 100, 2
        ) if len(prices) > 1 else 0

        return {
            "ticker":            ticker,
            "market":            market,
            "symbol":            symbol,
            "current_price":     round(prices[-1], 2),
            "currency":          "USD" if market == "US" else "SAR",
            "change_today_pct":  change_today,
            "consecutive_up_days": consecutive_up,
            "volatility":        volatility,
            "volume_ratio":      volume_ratio,
            "price_30d_ago":     round(prices[0], 2),
            "price_change_30d_pct": round(
                ((prices[-1] - prices[0]) / prices[0]) * 100, 2
            )
        }

    except Exception as e:
        return {"error": str(e)}


def get_user_portfolio(user_id):
    """Returns user's portfolio — replace with real DB later"""
    return {
        "user_id":               user_id,
        "total_value_sar":       50000,
        "available_balance_sar": 3200,
        "risk_profile":          "medium",
        "max_loss_threshold_pct": 10,
        "holdings": [
            {"ticker": "2010", "name": "SABIC",    "weight_pct": 42},
            {"ticker": "2222", "name": "Aramco",   "weight_pct": 30},
            {"ticker": "1120", "name": "Al Rajhi", "weight_pct": 28}
        ]
    }


def run_prediction(ticker, market="SA"):
    """Runs the LSTM model for the correct market"""
    return predict(ticker, market=market)


# ── TOOLS DEFINITION ──────────────────────────────────────────────

tools_definition = [
    {
        "type": "function",
        "function": {
            "name": "get_stock_data",
            "description": "Fetches real-time price, volume and trend data for a stock",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticker": {
                        "type": "string",
                        "description": "Stock ticker e.g. 2222 for Aramco, AAPL for Apple"
                    },
                    "market": {
                        "type": "string",
                        "enum": ["SA", "US"],
                        "description": "SA for Saudi stocks, US for US stocks"
                    }
                },
                "required": ["ticker"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_portfolio",
            "description": "Returns the user's current portfolio, risk profile and available balance",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"}
                },
                "required": ["user_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_prediction",
            "description": "Runs the LSTM model on a stock and returns direction and confidence",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticker": {
                        "type": "string",
                        "description": "Stock ticker"
                    },
                    "market": {
                        "type": "string",
                        "enum": ["SA", "US"],
                        "description": "SA for Saudi stocks, US for US stocks"
                    }
                },
                "required": ["ticker"]
            }
        }
    }
]

available_tools = {
    "get_stock_data":     lambda **kwargs: get_stock_data(**kwargs),
    "get_user_portfolio": get_user_portfolio,
    "run_prediction":     lambda **kwargs: run_prediction(**kwargs)
}


# ── SYSTEM PROMPT ─────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are Nameha's AI analyst for beginner investors.

You have 3 tools. Use them in this order:
1. get_stock_data - get real market data for the stock
2. get_user_portfolio - get the user's risk profile and holdings
3. run_prediction - get the AI forecast

Always pass the market parameter to get_stock_data and run_prediction.

After using all 3 tools, return ONLY a JSON object. No markdown, no extra text.

Return exactly this structure:
{
  "opportunity_spotted": true or false,
  "scenario_summary": "2-3 sentence plain English summary for a beginner",
  "signals": [
    {"category": "Price direction", "description": "one short sentence", "label": "Positive"},
    {"category": "Investor activity", "description": "one short sentence", "label": "Positive"},
    {"category": "Price swings", "description": "one short sentence", "label": "Neutral"},
    {"category": "Short-term direction", "description": "one short sentence", "label": "Watch"}
  ],
  "risk": {
    "level": "Low or Medium or High",
    "explanation": "one sentence based on portfolio concentration"
  },
  "portfolio_impact": {
    "current_exposure_pct": 42,
    "exposure_after_trade_pct": 56,
    "risk_profile": "Medium",
    "loss_cap_pct": 10,
    "warning": "one sentence warning or null"
  },
  "signal_confidence": {
    "score_pct": 78,
    "explanation": "one plain sentence about reliability"
  }
}

Label values must be exactly: Positive, Neutral, Watch, or Negative
opportunity_spotted = true only if mostly Positive signals AND confidence above 65%
Use simple beginner-friendly language. Never use financial jargon.
"""


# ── AGENT LOOP ────────────────────────────────────────────────────

def run_agent(messages):
    while True:
        try:
            response = _chat_with_fallback(
                messages,
                tools=tools_definition,
                tool_choice="auto",
                max_tokens=2048
            )
        except Exception as e:
            print(f"  API error: {e}")
            print("  Retrying without tools...")
            messages.append({
                "role": "user",
                "content": "Based on the data collected so far, "
                           "return the analysis as a JSON object."
            })
            response = _chat_with_fallback(messages, max_tokens=2048)
            return response.choices[0].message.content

        msg = response.choices[0].message

        if msg.tool_calls is None:
            return msg.content

        messages.append({
            "role":       "assistant",
            "content":    msg.content or "",
            "tool_calls": [
                {
                    "id":   tc.id,
                    "type": "function",
                    "function": {
                        "name":      tc.function.name,
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

            if tool_name in available_tools:
                result = available_tools[tool_name](**tool_input)
            else:
                result = {"error": f"Unknown tool: {tool_name}"}

            messages.append({
                "role":        "tool",
                "tool_call_id": tc.id,
                "content":     json.dumps(result)
            })


# ── MAIN FUNCTION ─────────────────────────────────────────────────

def analyze_stock(ticker: str, scenario: str, user_id: str,
                  amount_sar: float = 5000, market: str = "SA",
                  user_name: str = ""):
    """
    Main function — call this to analyze a stock
    ticker:   e.g. "2010" for SABIC, "AAPL" for Apple
    scenario: "buy", "sell", or "hold"
    user_id:  the logged in user
    market:   "SA" for Saudi, "US" for US stocks
    """
    user_ref = f"for {user_name}" if user_name else ""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Analyze stock {ticker} {user_ref}. "
                       f"Scenario: the investor is considering to {scenario}. "
                       f"Amount: {amount_sar} SAR. "
                       f"Market: {market}. "
                       f"When calling get_stock_data and run_prediction, "
                       f"always pass market='{market}'."
        }
    ]

    raw = run_agent(messages)

    try:
        clean  = raw.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        return {"success": True, "data": result}
    except json.JSONDecodeError:
        return {"success": False, "error": "Could not parse response", "raw": raw}


# ── TEST ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Testing Saudi stock ===\n")
    result = analyze_stock(
        ticker="2010",
        scenario="buy",
        user_id="user_001",
        amount_sar=7000,
        market="SA"
    )

    if result["success"]:
        data = result["data"]
        print(f"Opportunity spotted: {data['opportunity_spotted']}")
        print(f"Summary: {data['scenario_summary']}")
        print(f"Signals:")
        for s in data["signals"]:
            print(f"  [{s['label']}] {s['category']}: {s['description']}")
        print(f"Confidence: {data['signal_confidence']['score_pct']}%")
    else:
        print("Error:", result["error"])

    print("\n\n=== Testing US stock ===\n")
    result = analyze_stock(
        ticker="AAPL",
        scenario="buy",
        user_id="user_001",
        amount_sar=7000,
        market="US"
    )

    if result["success"]:
        data = result["data"]
        print(f"Opportunity spotted: {data['opportunity_spotted']}")
        print(f"Summary: {data['scenario_summary']}")
        print(f"Signals:")
        for s in data["signals"]:
            print(f"  [{s['label']}] {s['category']}: {s['description']}")
        print(f"Confidence: {data['signal_confidence']['score_pct']}%")
    else:
        print("Error:", result["error"])