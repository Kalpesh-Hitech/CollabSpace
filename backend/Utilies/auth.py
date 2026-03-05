from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from Models.Users import UserDB
from Core.Config.config import settings
import jwt
from fastapi import Depends, HTTPException,status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from Core.Config.database import async_get_db, get_db
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession


ph = PasswordHasher()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False
oauth2_scheme=OAuth2PasswordBearer(tokenUrl="login")
async def get_current_user(
        token:str=Depends(oauth2_scheme),db:AsyncSession=Depends(async_get_db)
):
    try:
        payload=jwt.decode(
            token,settings.SECRET_KEY,algorithms=settings.ALGORITHM
        )
        email=payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401,detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401,detail="Invalid token")
    
    query=select(UserDB).where(UserDB.email==email)
    result=await db.execute(query)
    user=result.scalars().first()
    # user=db.query(UserDB).filter(UserDB.email==email).first()

    if not user:
        raise HTTPException(status_code=401,detail="User Not Found!!")
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UserDB  = Depends(get_current_user)):
        if user.role.lower() not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough permissions to access this resource"
            )
        return user
