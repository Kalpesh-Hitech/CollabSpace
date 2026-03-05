from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserProfile(BaseModel):
    id: int
    email: EmailStr


class UserOtp(BaseModel):
    email: EmailStr
    otp: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class DeActive(BaseModel):
    email: EmailStr


class ChangePassword(BaseModel):
    old_password: str
    new_password: str


class ChangeEmail(BaseModel):
    email: EmailStr
    otp: str


class ForgetPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    new_password: str

class TransactionCreate(BaseModel):
    date: str
    category: str
    label: str
    amount: float
    type: str  # "income" | "expense"

class TransactionOut(TransactionCreate):
    id: int
    class Config:
        from_attributes = True

class BudgetCreate(BaseModel):
    category: str
    budget_amount: float
    color: Optional[str] = "#6366f1"

class BudgetOut(BudgetCreate):
    id: int
    spent: float
    class Config:
        from_attributes = True