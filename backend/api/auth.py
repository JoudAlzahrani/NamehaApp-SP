import secrets
import unicodedata
from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.security import create_access_token
from database import get_db
from models.user_account import UserAccount

router = APIRouter(prefix="/auth", tags=["Auth"])

RESET_TOKEN_EXPIRE_MINUTES = 30


def normalize_email(email: str) -> str:
    """إزالة الأحرف غير المرئية وتحويل الإيميل لأحرف صغيرة."""
    cleaned = "".join(c for c in email if unicodedata.category(c) not in ("Cf", "Cc"))
    return cleaned.strip().lower()


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    email = normalize_email(body.email)

    if db.query(UserAccount).filter(UserAccount.email == email).first():
        raise HTTPException(status_code=400, detail="لديك حساب بالفعل، يرجى تسجيل الدخول")

    password_hash = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt())

    user = UserAccount(
        name=body.name,
        email=email,
        password_hash=password_hash.decode("utf-8"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"user_id": user.id, "name": user.name, "email": user.email, "access_token": token, "token_type": "bearer"}


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    email = normalize_email(body.email)

    user = db.query(UserAccount).filter(UserAccount.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="البريد الإلكتروني أو كلمة المرور غير صحيحة")

    password_match = bcrypt.checkpw(
        body.password.encode("utf-8"),
        user.password_hash.encode("utf-8"),
    )
    if not password_match:
        raise HTTPException(status_code=401, detail="البريد الإلكتروني أو كلمة المرور غير صحيحة")

    token = create_access_token(user.id)
    return {"user_id": user.id, "name": user.name, "email": user.email, "access_token": token, "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = normalize_email(body.email)
    user = db.query(UserAccount).filter(UserAccount.email == email).first()

    # نرجع نفس الرسالة حتى لو الإيميل ما يوجد (أمان ضد تخمين الإيميلات)
    if not user:
        return {"message": "إذا كان الإيميل مسجلاً، ستصلك رسالة استعادة كلمة المرور"}

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    db.commit()

    # TODO: أرسل الـ token عبر إيميل في بيئة الإنتاج
    # في بيئة التطوير: نرجعه مباشرة
    return {
        "message": "تم إنشاء رمز استعادة كلمة المرور",
        "reset_token": reset_token,
        "expires_in_minutes": RESET_TOKEN_EXPIRE_MINUTES,
    }


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.reset_token == body.token).first()

    if not user:
        raise HTTPException(status_code=400, detail="رمز الاستعادة غير صالح")

    if not user.reset_token_expiry or datetime.utcnow() > user.reset_token_expiry:
        raise HTTPException(status_code=400, detail="رمز الاستعادة منتهي الصلاحية، يرجى طلب رمز جديد")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="كلمة المرور يجب أن تكون 6 أحرف على الأقل")

    new_hash = bcrypt.hashpw(body.new_password.encode("utf-8"), bcrypt.gensalt())
    user.password_hash = new_hash.decode("utf-8")
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()

    return {"message": "تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن"}
