from Models.Users import UserDB as User
from Core.Config.database import get_db
from sqlalchemy.orm import Session
import string
import random
from fastapi import APIRouter, Depends, HTTPException
from fastapi import BackgroundTasks
from Utilies.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password
)
from Core.Authetication.auth import (
    send_otp_email,
    is_valid_email
)
from Schemas.AuthSchemas import (
    ChangeEmail,
    ChangePassword,
    ForgetPassword,
    ResetPassword,
    Token,
    UserOtp,
    UserCreate
)
from Schemas.UserSchemas import UserCreate
from datetime import datetime, timedelta, timezone
from jose import jwt
from Core.Config.config import settings

router = APIRouter()


# @router.post("/signup", status_code=201)
# def signup(
#     user: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
# ):
#     print(user)
#     existing_user = db.query(User).filter(User.email == user.email).first()
#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered!!")
#     hashed_pw = hash_password(user.password)

#     new_user = User(email=user.email, password=hashed_pw,role=user.role.lower(),name=user.name)

#     otp = "".join(random.choices(string.digits, k=6))
#     new_user.otp = otp
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)
#     background_tasks.add_task(send_otp_email, user.email, otp)
#     return {"message": "User Created SuccessFully!!"}


# @router.post("/signin")
# def signin(user: UserCreate, db: Session = Depends(get_db)):
#     db_user = db.query(User).filter(User.email == user.email).first()

#     if not db_user:
#         raise HTTPException(status_code=400, detail="Invalid Credential")
#     if not verify_password(user.password, db_user.password):
#         raise HTTPException(status_code=400, detail="Invalid Credential")
#     if not db_user.isvalid:
#         raise HTTPException(status_code=401, detail="please valid first")
#     if not db_user.is_active:
#         raise HTTPException(status_code=401, detail="this account is inactive")

#     access_token = create_access_token(data={"sub": db_user.email})
#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "user": {
#             "email": db_user.email,
#             # add more fields if your User model has them e.g. name, id
#         }
#     }

@router.post("/verifyemail", response_model=dict)
def api_verify_email(verifyotp: UserOtp, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == verifyotp.email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="user is not exist!!")
    
    if db_user.otp != verifyotp.otp:
        raise HTTPException(status_code=400, detail="otp is invalid")
    
    db_user.isvalid = True
    db_user.otp = None          # ✅ Clear OTP after use
    db.commit()
    db.refresh(db_user)
    return {"message": "email verified successfully"}


@router.patch("/deactive")
def deactive_user(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not user.is_active:
        raise HTTPException(status_code=400, detail="this account is deactivated!!")
    user.is_active = False
    db.commit()
    return {"message": "your account is deactivated!!"}


@router.post("/change_password")
def change_password_(
    new_info: ChangePassword,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.is_active:
        raise HTTPException(status_code=400, detail="this account is deactivated!!")
    if not (verify_password(new_info.old_password, user.password)):
        raise HTTPException(status_code=400, detail="please enter the right password!!")
    hashed_password = hash_password(new_info.new_password)
    user.password = hashed_password
    db.commit()
    return {"password": "password badal gya hai"}


@router.post("/request-change-email")
def request_change_email(
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_email = db.query(User).filter(User.email == user.email).first()
    if not db_email:
        raise HTTPException(status_code=400, detail="this account is not exist!!")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="this account is deactivated!!")
    otp = "".join(random.choices(string.digits, k=6))
    db_email.otp = otp
    db.commit()
    db.refresh(db_email)
    background_tasks.add_task(send_otp_email, user.email, otp)
    return {"message": "For changing the email otp is generated SuccessFully!!"}


@router.put("/change_email")
def change_password(
    new_info: ChangeEmail,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not is_valid_email(new_info.email):
        raise HTTPException(status_code=400, detail="email is not validated!!")
    db_email = db.query(User).filter(User.email == user.email).first()
    if not db_email:
        raise HTTPException(status_code=400, detail="this account is not exist!!")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="this account is deactivated!!")
    # print(type(user.otp))
    if not (user.otp == int(new_info.otp)):
        raise HTTPException(status_code=400, detail="otp galat hai!!")
    user.email = new_info.email
    token = create_access_token({"sub": new_info.email})
    db.commit()
    return {"email": "email is changed!!", "token": token}


@router.post("/forgetpassword")
def forget_password(data: ForgetPassword, db: Session = Depends(get_db)):
    db_email = db.query(User).filter(User.email == data.email).first()
    if not db_email:
        raise HTTPException(status_code=400, detail="email is not existed!!")
    if not db_email.is_active:
        raise HTTPException(status_code=400, detail="this account is deactivated!!")
    db_email.reset_token_expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": data.email}
    to_encode.update({"exp": db_email.reset_token_expiry})
    db_email.reset_token = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    db.commit()
    return {
        "reset token": db_email.reset_token,
        "expire": "please reset password in 15 minutes",
    }


@router.post("/reset_password")
def reset_password(
    new_info: ResetPassword,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.is_active:
        raise HTTPException(status_code=400, detail="this account is deactivated!!")
    if user.reset_token_expiry < datetime.utcnow():
        user.reset_token = None
        user.reset_token_expiry = None
        db.commit()
        raise HTTPException(status_code=400, detail="token is expired!!")
    hashed_password = hash_password(new_info.new_password)
    user.password = hashed_password
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    return {"password": "password badal gya hai"}

