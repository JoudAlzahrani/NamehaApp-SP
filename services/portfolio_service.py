from sqlalchemy.orm import Session
from models.portfolio import Portfolio
from models.position import Position
from models.transaction import Transaction
from services.finnhub_service import get_quote


def create_portfolio_if_not_exists(db: Session, user_id: str):
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()

    if not portfolio:
        portfolio = Portfolio(user_id=user_id, cash_balance=5000)
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)

    return portfolio


def get_user_portfolio(db: Session, user_id: str):
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()

    if not portfolio:
        return {"error": "Portfolio not found"}

    positions = db.query(Position).filter(Position.portfolio_id == portfolio.id).all()
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()

    positions_data = []
    total_market_value = 0.0

    for p in positions:
        quote = get_quote(p.symbol)
        current_price = quote.get("c") or p.avg_price
        market_value = p.quantity * current_price
        change_percent = ((current_price - p.avg_price) / p.avg_price * 100) if p.avg_price else 0.0
        total_market_value += market_value

        positions_data.append({
            "symbol": p.symbol,
            "quantity": p.quantity,
            "avg_price": p.avg_price,
            "current_price": current_price,
            "market_value": round(market_value, 2),
            "change_percent": round(change_percent, 2),
            "is_positive": change_percent >= 0,
        })

    total_value = portfolio.cash_balance + total_market_value

    return {
        "id": portfolio.id,
        "user_id": portfolio.user_id,
        "cash_balance": portfolio.cash_balance,
        "total_value": round(total_value, 2),
        "total_market_value": round(total_market_value, 2),
        "positions": positions_data,
        "transactions": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "action": t.action,
                "price": t.price,
                "quantity": t.quantity,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in transactions
        ],
    }


def buy_stock(db: Session, user_id: str, symbol: str, price: float, budget: float):
    portfolio = create_portfolio_if_not_exists(db, user_id)

    if portfolio.cash_balance < budget:
        return {"error": "Not enough balance"}

    quantity = budget / price
    portfolio.cash_balance -= budget

    position = db.query(Position).filter(
        Position.portfolio_id == portfolio.id,
        Position.symbol == symbol
    ).first()

    if position:
        old_qty = position.quantity
        old_avg = position.avg_price
        new_qty = old_qty + quantity
        new_avg = ((old_qty * old_avg) + (quantity * price)) / new_qty
        position.quantity = new_qty
        position.avg_price = new_avg
    else:
        position = Position(
            portfolio_id=portfolio.id,
            symbol=symbol,
            quantity=quantity,
            avg_price=price,
        )
        db.add(position)

    transaction = Transaction(
        user_id=user_id,
        symbol=symbol,
        action="BUY",
        price=price,
        quantity=quantity,
    )
    db.add(transaction)
    db.commit()
    db.refresh(portfolio)

    return {
        "action": "BUY",
        "symbol": symbol,
        "price": price,
        "quantity": quantity,
        "cash_balance": portfolio.cash_balance,
    }


def sell_stock(db: Session, user_id: str, symbol: str, price: float, quantity: float):
    portfolio = create_portfolio_if_not_exists(db, user_id)

    position = db.query(Position).filter(
        Position.portfolio_id == portfolio.id,
        Position.symbol == symbol
    ).first()

    if not position:
        return {"error": "No position found for this symbol"}

    if position.quantity < quantity:
        return {"error": "Not enough shares"}

    position.quantity -= quantity
    portfolio.cash_balance += price * quantity

    if position.quantity == 0:
        db.delete(position)

    transaction = Transaction(
        user_id=user_id,
        symbol=symbol,
        action="SELL",
        price=price,
        quantity=quantity,
    )
    db.add(transaction)
    db.commit()
    db.refresh(portfolio)

    return {
        "action": "SELL",
        "symbol": symbol,
        "price": price,
        "quantity": quantity,
        "cash_balance": portfolio.cash_balance,
    }
