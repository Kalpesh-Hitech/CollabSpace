import bcrypt

from datetime import datetime, timedelta, timezone
from Models.Users import UserDB as User
from Core.Config.config import settings
from jose import jwt,JWTError
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from Core.Config.database import get_db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)




def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed_password.decode("utf-8")


def verify_password(palin_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        palin_password.encode("utf-8"), hashed_password.encode("utf-8")
    )
oauth2_scheme=OAuth2PasswordBearer(tokenUrl="login")
def get_current_user(
        token:str=Depends(oauth2_scheme),db:Session=Depends(get_db)
):
    try:
        payload=jwt.decode(
            token,settings.SECRET_KEY,algorithms=settings.ALGORITHM
        )
        email=payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401,detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401,detail="Invalid token")
    
    user=db.query(User).filter(User.email==email).first()

    if not user:
        raise HTTPException(status_code=401,detail="User Not Found!!")
    return user

    
def send_otp_email(to_email: str, otp: str):
    subject = "Your OTP Verification Code"
    body = f"""
    Hello,

    Your OTP code is: {otp}

    Please use this to verify your account.

    Thank you!
    """

    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_ADDRESS
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
    server.starttls()
    server.login(settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD)
    server.sendmail(settings.EMAIL_ADDRESS, to_email, msg.as_string())
    server.quit()

email_pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
def is_valid_email(email):
    return re.match(email_pattern, email) is not None
    