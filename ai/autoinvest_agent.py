from groq import Groq, RateLimitError
from dotenv import load_dotenv
import os
import json
import yfinance as yf
import numpy as np

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]

def _chat_with_fallback(messages, tools=None, tool_choice=None, max_tokens=2048):
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

def get_user_portfolio(user_id):
    """Returns user's portfolio and risk profile — replace with real DB later"""
    return {
        "user_id": user_id,
        "available_balance_sar": 3200,
        "total_value_sar": 50000,
        "risk_profile": "medium",
        "max_loss_threshold_pct": 10,
        "holdings": [
            {"ticker": "2010", "name": "SABIC",    "weight_pct": 42},
            {"ticker": "2222", "name": "Aramco",   "weight_pct": 30},
            {"ticker": "1120", "name": "Al Rajhi", "weight_pct": 28}
        ]
    }


def get_top_sectors(risk_profile, duration_months):
    """
    Returns best sectors based on risk profile and duration.
    Replace with real Tadawul sector analysis in Phase 3.
    """
    allocations = {
        "low":    [("Energy", 50),     ("Finance", 40),  ("Healthcare", 10)],
        "medium": [("Energy", 40),     ("Finance", 35),  ("Technology", 25)],
        "high":   [("Technology", 45), ("Energy", 30),   ("Real Estate", 25)]
    }

    sectors = allocations.get(risk_profile, allocations["medium"])

    return {
        "sectors": [
            {
                "name": s[0],
                "allocation_pct": s[1],
                "momentum": "strong" if s[1] >= 40 else "moderate"
            }
            for s in sectors
        ],
        "rationale": f"Selected for {risk_profile} risk over {duration_months} months"
    }


def get_best_stocks_in_sector(sector, risk_profile):
    """
    Returns top stocks in a sector.
    Replace with real LSTM predictions in Phase 3.
    """
    stocks = {
        "Energy": [
            {"ticker": "2222", "name": "Saudi Aramco", "confidence_pct": 81, "predicted_return_pct": 14.2},
            {"ticker": "2030", "name": "SABIC Agri",   "confidence_pct": 74, "predicted_return_pct": 11.8}
        ],
        "Finance": [
            {"ticker": "1120", "name": "Al Rajhi Bank",  "confidence_pct": 78, "predicted_return_pct": 13.1},
            {"ticker": "1180", "name": "Al Jazira Bank", "confidence_pct": 71, "predicted_return_pct": 10.5}
        ],
        "Technology": [
            {"ticker": "7010", "name": "STC",      "confidence_pct": 76, "predicted_return_pct": 15.4},
            {"ticker": "7020", "name": "Zain KSA", "confidence_pct": 68, "predicted_return_pct": 12.9}
        ],
        "Healthcare": [
            {"ticker": "4002", "name": "Mouwasat",   "confidence_pct": 72, "predicted_return_pct": 10.2}
        ],
        "Real Estate": [
            {"ticker": "4300", "name": "Dar Al Arkan", "confidence_pct": 65, "predicted_return_pct": 16.1}
        ]
    }

    return {
        "sector": sector,
        "top_picks": stocks.get(sector, [])
    }


def calculate_return_projection(amount_sar, duration_months, risk_profile):
    """
    Calculates estimated return range.
    Replace with real LSTM-based projections in Phase 3.
    """
    rates = {
        "low":    {"conservative": 0.08, "optimistic": 0.12},
        "medium": {"conservative": 0.12, "optimistic": 0.18},
        "high":   {"conservative": 0.15, "optimistic": 0.28}
    }

    r      = rates.get(risk_profile, rates["medium"])
    period = duration_months / 12

    return {
        "amount_sar":              amount_sar,
        "duration_months":         duration_months,
        "conservative_return_sar": round(amount_sar * r["conservative"] * period),
        "optimistic_return_sar":   round(amount_sar * r["optimistic"]   * period),
        "conservative_pct":        round(r["conservative"] * period * 100, 1),
        "optimistic_pct":          round(r["optimistic"]   * period * 100, 1),
        "disclaimer":              "Predictions are estimates, not guarantees"
    }


# ── TOOLS DEFINITION ──────────────────────────────────────────────

tools_definition = [
    {
        "type": "function",
        "function": {
            "name": "get_user_portfolio",
            "description": "Returns the user's portfolio, available balance and risk profile",
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
            "name": "get_top_sectors",
            "description": "Returns the best sectors to invest in based on risk profile and duration",
            "parameters": {
                "type": "object",
                "properties": {
                    "risk_profile": {
                        "type": "string",
                        "enum": ["low", "medium", "high"]
                    },
                    "duration_months": {"type": "integer"}
                },
                "required": ["risk_profile", "duration_months"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_best_stocks_in_sector",
            "description": "Returns top stocks in a given sector. Call this separately for each sector.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sector": {
                        "type": "string",
                        "description": "Exact sector name e.g. Energy, Finance, Technology"
                    },
                    "risk_profile": {
                        "type": "string",
                        "enum": ["low", "medium", "high"]
                    }
                },
                "required": ["sector", "risk_profile"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_return_projection",
            "description": "Calculates the estimated conservative and optimistic return for an investment",
            "parameters": {
                "type": "object",
                "properties": {
                    "amount_sar":      {"type": "number"},
                    "duration_months": {"type": "integer"},
                    "risk_profile": {
                        "type": "string",
                        "enum": ["low", "medium", "high"]
                    }
                },
                "required": ["amount_sar", "duration_months", "risk_profile"]
            }
        }
    }
]

available_tools = {
    "get_user_portfolio":          get_user_portfolio,
    "get_top_sectors":             get_top_sectors,
    "get_best_stocks_in_sector":   get_best_stocks_in_sector,
    "calculate_return_projection": calculate_return_projection
}


# ── SYSTEM PROMPT ─────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are Nameha's auto-invest AI for beginner investors in Saudi Arabia.

You have 4 tools. Use them in this order:
1. get_user_portfolio - to get the user's risk profile
2. get_top_sectors - to get the list of sectors to invest in
3. get_best_stocks_in_sector - call this for EACH sector using its exact name
4. calculate_return_projection - to get return estimates

After using all tools, return a JSON object only. No markdown, no extra text.

Return exactly this structure:
{
  "plan_summary": "one warm beginner-friendly sentence summarising the plan",
  "amount_sar": 5000,
  "duration_months": 6,
  "estimated_return": {
    "conservative_sar": 620,
    "optimistic_sar": 890,
    "conservative_pct": 12.4,
    "optimistic_pct": 17.8,
    "label": "over 6 months based on your Medium risk profile"
  },
  "sector_allocation": [
    {
      "sector": "Energy",
      "allocation_pct": 40,
      "color": "amber",
      "top_stocks": [
        {
          "ticker": "2222",
          "name": "Saudi Aramco",
          "amount_sar": 2000,
          "confidence_pct": 81
        }
      ]
    },
    {
      "sector": "Finance",
      "allocation_pct": 35,
      "color": "blue",
      "top_stocks": [
        {
          "ticker": "1120",
          "name": "Al Rajhi Bank",
          "amount_sar": 1750,
          "confidence_pct": 78
        }
      ]
    },
    {
      "sector": "Technology",
      "allocation_pct": 25,
      "color": "purple",
      "top_stocks": [
        {
          "ticker": "7010",
          "name": "STC",
          "amount_sar": 1250,
          "confidence_pct": 76
        }
      ]
    }
  ],
  "risk_note": "one sentence about how this plan matches the user's risk profile",
  "requires_user_approval": true
}

Rules:
- sector_allocation must include ALL sectors from get_top_sectors
- color values: amber, blue, purple, teal, green
- requires_user_approval must ALWAYS be true
- Never use financial jargon
"""


# ── AGENT LOOP ────────────────────────────────────────────────────

def run_agent(messages):
    max_iterations = 10
    iteration = 0

    while iteration < max_iterations:
        iteration += 1

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
                           "return the investment plan as a JSON object."
            })
            response = _chat_with_fallback(messages, max_tokens=2048)
            return response.choices[0].message.content

        msg = response.choices[0].message

        # No more tool calls — return final answer
        if not msg.tool_calls:
            return msg.content

        # Add assistant response to history
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

        # Run each tool and collect results
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


# ── MAIN FUNCTIONS ────────────────────────────────────────────────

def preview_plan(user_id: str, amount_sar: float, duration_months: int):
    """
    Generates the investment plan preview.
    Called when user enters amount + duration.
    Nothing is invested yet — preview only.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"User {user_id} wants to auto-invest {amount_sar} SAR "
                       f"for {duration_months} months. Build their plan."
        }
    ]

    raw = run_agent(messages)

    try:
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        plan  = json.loads(clean)
        return {"success": True, "data": plan}
    except json.JSONDecodeError:
        return {"success": False, "error": "Could not parse plan", "raw": raw}


def confirm_plan(user_id: str, plan: dict):
    """
    Called when user taps 'Start growing'.
    Trades would execute here in Phase 3.
    """
    print(f"\nPlan confirmed by {user_id}")
    print(f"Amount: {plan['amount_sar']} SAR")
    print(f"Duration: {plan['duration_months']} months")
    for s in plan.get("sector_allocation", []):
        print(f"  {s['sector']}: {s['allocation_pct']}%")

    return {
        "success": True,
        "message": "Your investment plan has been activated.",
        "status": "active"
    }


# ── TEST ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Generating auto-invest plan...\n")

    result = preview_plan(
        user_id="user_001",
        amount_sar=5000,
        duration_months=6
    )

    if result["success"]:
        data = result["data"]
        print(f"Summary: {data['plan_summary']}")
        print(f"\nEstimated return: "
              f"{data['estimated_return']['conservative_sar']} – "
              f"{data['estimated_return']['optimistic_sar']} SAR")
        print(f"({data['estimated_return']['conservative_pct']}% – "
              f"{data['estimated_return']['optimistic_pct']}%)")
        print(f"\nWhere the AI will invest:")
        for s in data["sector_allocation"]:
            print(f"  {s['sector']}: {s['allocation_pct']}%")
            for stock in s["top_stocks"]:
                print(f"    └ {stock['name']} — {stock['amount_sar']} SAR "
                      f"(confidence: {stock['confidence_pct']}%)")
        print(f"\nRisk note: {data['risk_note']}")
        print(f"Requires approval: {data['requires_user_approval']}")

        # Simulate user tapping 'Start growing'
        print("\n--- User taps Start growing ---")
        confirm = confirm_plan("user_001", data)
        print(confirm["message"])

    else:
        print("Error:", result["error"])
        print("Raw:", result.get("raw"))