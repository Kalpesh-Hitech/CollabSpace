from datetime import datetime, timedelta, timezone
import jwt
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from Core.Config.config import settings
from Core.Config.database import async_get_db
from Models.InviteToken import InviteTokenDB
from Models.Teams import TeamsDB
from Models.UserTeams import UserTeamsDB
from Models.Users import UserDB
from Models.Notification import NotifType
from Schemas.SpecializeSchemas import InviteCreate, InviteRead
from Schemas.UserSchemas import Login, UserCreate, UserLogin, UserRead, UserTeam
import uuid
from Utilies.auth import (
    RoleChecker,
    create_access_token,
    get_current_user,
    verify_password,
    hash_password,
)
from Utilies.helper import send_task_completion_email

# ── Import the notification helper ───────────────────────────────────────────
# Make sure your notify_route.py / router.py exposes create_notification()
from Routes.Notification.notify_route import create_notification   # ← adjust import path to match YOUR file name

create_router = APIRouter()


@create_router.post("/create_user", response_model=UserRead)
async def create_user(
    userseed: UserCreate,
    user    : UserDB       = Depends(RoleChecker(["admin", "manager"])),
    db      : AsyncSession = Depends(async_get_db),
):
    if user.role == "manager" and (
        userseed.role == "manager" or userseed.role == "admin"
    ):
        raise HTTPException(status_code=403, detail="only admin can create the admin and manager")
    hashed_password = hash_password(userseed.password)
    new_user = UserDB(
        name=userseed.name, email=userseed.email,
        password=hashed_password, role=userseed.role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@create_router.post("/login", response_model=Login)
async def login(userseed: UserLogin, db: AsyncSession = Depends(async_get_db)):
    result  = await db.execute(
        select(UserDB).where(UserDB.email == userseed.email, UserDB.is_active == True)
    )
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="user is not found!!")
    if not verify_password(userseed.password, db_user.password):
        raise HTTPException(status_code=404, detail="password is incorrect!!")
    token = create_access_token({"sub": db_user.email})
    return {"token": token, "user": {"email": userseed.email}}


@create_router.post("/assignee_teams")
async def assign_team_touser(
    userteamseed: UserTeam,
    user: UserDB       = Depends(RoleChecker(["manager"])),
    db  : AsyncSession = Depends(async_get_db),
):
    db_team        = await db.execute(
        select(TeamsDB).where(TeamsDB.id == userteamseed.team_id, TeamsDB.is_deleted == False)
    )
    db_user_result = db_team.scalars().first()
    if not db_user_result:
        raise HTTPException(status_code=404, detail="ye team id galat hai!!")
    if db_user_result.create_by_id != user.id:
        raise HTTPException(status_code=403, detail="You can only assign employees to your own team")
    db_validate_user        = await db.execute(
        select(UserDB).where(UserDB.id == userteamseed.user_id, UserDB.is_active == True)
    )
    db_validate_user_result = db_validate_user.scalars().first()
    if not db_validate_user_result and db_validate_user_result.role != "employee":
        raise HTTPException(status_code=401, detail="user is not validate!!")
    existing = (await db.execute(
        select(UserTeamsDB).where(
            UserTeamsDB.user_id == userteamseed.user_id,
            UserTeamsDB.team_id == userteamseed.team_id,
        )
    )).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="user pehle se team me h")
    new_userteam = UserTeamsDB(**userteamseed.model_dump())
    db.add(new_userteam)
    await db.commit()
    await db.refresh(new_userteam)
    return {"this user is assigned to team"}


@create_router.post("/create-invite")  # returning plain dict — no response_model to avoid ORM serialization
async def create_invite_token(
    background_task: BackgroundTasks,
    data           : InviteCreate,
    db             : AsyncSession = Depends(async_get_db),
    current_user   : UserDB       = Depends(RoleChecker(["manager"])),
):
    # ── Step 1: Read ALL ORM fields into plain variables BEFORE any commit ────
    # Accessing ORM attributes after db.commit() causes MissingGreenlet in async
    sender_id   = current_user.id
    sender_name = current_user.name

    # ── Step 2: Validate team ─────────────────────────────────────────────────
    team = await db.get(TeamsDB, data.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.create_by_id != sender_id:
        raise HTTPException(status_code=403, detail="You can only create invite for your own team")

    team_name = team.name   # read before commit
    team_id   = team.id

    # ── Step 3: Validate invited user ─────────────────────────────────────────
    db_user = (await db.execute(
        select(UserDB).where(UserDB.email == data.user_email, UserDB.role == "employee")
    )).scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="email not found")

    already_member = (await db.execute(
        select(UserTeamsDB).where(
            UserTeamsDB.user_id == db_user.id,
            UserTeamsDB.team_id == data.team_id,
        )
    )).scalars().first()
    if already_member:
        raise HTTPException(status_code=400, detail="User is already a member of this team")

    invited_user_id = db_user.id   # read before commit

    # ── Step 4: Create invite token ───────────────────────────────────────────
    payload          = {"sub": data.user_email, "team_id": str(data.team_id)}
    new_token_string = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    invite = InviteTokenDB(
        team_id     = data.team_id,
        create_by_id= sender_id,
        token       = new_token_string,
        expires_at  = datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(invite)
    await db.commit()         # ← first commit — after this all ORM objects are expired
    await db.refresh(invite)  # re-load invite so we can read invite.id safely

    # ── Read ALL invite fields into plain vars BEFORE create_notification() ────
    # create_notification() does its own db.commit() internally, which expires
    # the `invite` ORM object. FastAPI then can't serialize it → MissingGreenlet.
    invite_id          = invite.id
    invite_team_id     = invite.team_id
    invite_expires_at  = invite.expires_at
    invite_is_used     = invite.is_used
    invite_create_by   = invite.create_by_id

    # ── Step 5: Send invite email in background ───────────────────────────────
    background_task.add_task(send_task_completion_email, data.user_email, new_token_string)

    # ── Step 6: Create notification for the invited employee ─────────────────
    await create_notification(
        db              = db,
        recipient_id    = invited_user_id,
        sender_id       = sender_id,
        notif_type      = NotifType.TEAM_INVITE,
        title           = f'You\'ve been invited to join team "{team_name}"',
        message         = (
            f'{sender_name} has invited you to join the team "{team_name}". '
            f'Click Join to accept or Decline to ignore this invite.'
        ),
        team_id         = team_id,
        invite_token_id = invite_id,
        invite_token    = new_token_string,
    )

    # ── Return plain dict, NOT the ORM object ────────────────────────────────
    # After create_notification's internal commit, `invite` is expired.
    # Returning it would cause FastAPI to lazy-load → MissingGreenlet again.
    return {
        "id"          : invite_id,
        "team_id"     : invite_team_id,
        "token"       : new_token_string,
        "expires_at"  : invite_expires_at,
        "is_used"     : invite_is_used,
        "create_by_id": invite_create_by,
    }


@create_router.get("/verify-invite/{token}")
async def verify_invite_token(token: str, db: AsyncSession = Depends(async_get_db)):
    invite = (await db.execute(
        select(InviteTokenDB).where(InviteTokenDB.token == token)
    )).scalar_one_or_none()

    if not invite or invite.is_used:
        raise HTTPException(status_code=400, detail="Invalid or used invite")

    try:
        payload       = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email         = payload.get("sub")
        token_team_id = uuid.UUID(payload.get("team_id"))
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid token data")

    db_user = (await db.execute(
        select(UserDB).where(UserDB.email == email)
    )).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id_to_add = db_user.id

    invite.is_used = True
    db.add(UserTeamsDB(user_id=user_id_to_add, team_id=token_team_id))
    await db.commit()

    # ── Delete the invite notification now the user has acted on it ───────────
    from Models.Notification import NotificationDB
    notif = (await db.execute(
        select(NotificationDB).where(
            NotificationDB.invite_token == token,
            NotificationDB.recipient_id == user_id_to_add,
        )
    )).scalar_one_or_none()
    if notif:
        await db.delete(notif)
        await db.commit()

    return {"status": "success", "user_id": user_id_to_add, "team_id": token_team_id}