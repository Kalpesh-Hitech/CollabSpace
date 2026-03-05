"""
Routes/Notification/router.py
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from Core.Config.database import async_get_db
from Models.Notification import NotificationDB, NotifType
from Models.Users import UserDB
from Utilies.auth import get_current_user

notif_router = APIRouter(prefix="/notifications", tags=["notifications"])


# ── Schemas ────────────────────────────────────────────────────────────────────
class NotifOut(BaseModel):
    id            : UUID
    notif_type    : NotifType
    title         : str
    message       : str
    is_read       : bool
    created_at    : datetime
    team_id       : Optional[UUID] = None
    task_id       : Optional[UUID] = None
    sender_name   : Optional[str]  = None
    # Invite-specific — frontend uses this to call GET /verify-invite/{token}
    invite_token  : Optional[str]  = None
    invite_token_id: Optional[UUID] = None

    class Config:
        from_attributes = True


# ── Helper used by other routes to create notifications ───────────────────────
async def create_notification(
    db            : AsyncSession,
    recipient_id  : UUID,
    notif_type    : NotifType,
    title         : str,
    message       : str,
    sender_id     : Optional[UUID] = None,
    team_id       : Optional[UUID] = None,
    task_id       : Optional[UUID] = None,
    invite_token_id: Optional[UUID] = None,
    invite_token  : Optional[str]  = None,
) -> NotificationDB:
    notif = NotificationDB(
        recipient_id   = recipient_id,
        sender_id      = sender_id,
        notif_type     = notif_type,
        title          = title,
        message        = message,
        team_id        = team_id,
        task_id        = task_id,
        invite_token_id= invite_token_id,
        invite_token   = invite_token,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


# ── GET /notifications ────────────────────────────────────────────────────────
@notif_router.get("", response_model=List[NotifOut])
async def list_notifications(
    unread_only : bool = False,
    db          : AsyncSession = Depends(async_get_db),
    current_user: UserDB       = Depends(get_current_user),
):
    q = select(NotificationDB).where(
        NotificationDB.recipient_id == current_user.id
    ).order_by(NotificationDB.created_at.desc()).limit(50)

    if unread_only:
        q = q.where(NotificationDB.is_read == False)

    result = await db.execute(q)
    notifs = result.scalars().all()

    out = []
    for n in notifs:
        sender_name = None
        if n.sender_id:
            s = (await db.execute(
                select(UserDB).where(UserDB.id == n.sender_id)
            )).scalar_one_or_none()
            if s:
                sender_name = s.name
        out.append(NotifOut(
            id             = n.id,
            notif_type     = n.notif_type,
            title          = n.title,
            message        = n.message,
            is_read        = n.is_read,
            created_at     = n.created_at,
            team_id        = n.team_id,
            task_id        = n.task_id,
            sender_name    = sender_name,
            invite_token   = n.invite_token,
            invite_token_id= n.invite_token_id,
        ))
    return out


# ── GET /notifications/unread-count ──────────────────────────────────────────
@notif_router.get("/unread-count")
async def unread_count(
    db          : AsyncSession = Depends(async_get_db),
    current_user: UserDB       = Depends(get_current_user),
):
    result = await db.execute(
        select(NotificationDB).where(
            NotificationDB.recipient_id == current_user.id,
            NotificationDB.is_read      == False,
        )
    )
    count = len(result.scalars().all())
    return {"count": count}


# ── PATCH /notifications/{id}/read ───────────────────────────────────────────
@notif_router.patch("/{notif_id}/read")
async def mark_read(
    notif_id    : UUID,
    db          : AsyncSession = Depends(async_get_db),
    current_user: UserDB       = Depends(get_current_user),
):
    notif = (await db.execute(
        select(NotificationDB).where(
            NotificationDB.id           == notif_id,
            NotificationDB.recipient_id == current_user.id,
        )
    )).scalar_one_or_none()
    if not notif:
        raise HTTPException(404, "Notification not found")
    notif.is_read = True
    await db.commit()
    return {"message": "Marked as read"}


# ── PATCH /notifications/read-all ────────────────────────────────────────────
@notif_router.patch("/read-all")
async def mark_all_read(
    db          : AsyncSession = Depends(async_get_db),
    current_user: UserDB       = Depends(get_current_user),
):
    await db.execute(
        update(NotificationDB)
        .where(
            NotificationDB.recipient_id == current_user.id,
            NotificationDB.is_read      == False,
        )
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}


# ── POST /notifications/{id}/decline-invite ──────────────────────────────────
# User declines the team invite — just deletes the notification, no DB join
@notif_router.post("/{notif_id}/decline-invite")
async def decline_invite(
    notif_id    : UUID,
    db          : AsyncSession = Depends(async_get_db),
    current_user: UserDB       = Depends(get_current_user),
):
    notif = (await db.execute(
        select(NotificationDB).where(
            NotificationDB.id           == notif_id,
            NotificationDB.recipient_id == current_user.id,
            NotificationDB.notif_type   == NotifType.TEAM_INVITE,
        )
    )).scalar_one_or_none()

    if not notif:
        raise HTTPException(404, "Invite notification not found")

    await db.delete(notif)
    await db.commit()
    return {"message": "Invite declined"}


# ── DELETE /notifications/{id} ───────────────────────────────────────────────
@notif_router.delete("/{notif_id}")
async def delete_notification(
    notif_id    : UUID,
    db          : AsyncSession = Depends(async_get_db),
    current_user: UserDB       = Depends(get_current_user),
):
    notif = (await db.execute(
        select(NotificationDB).where(
            NotificationDB.id           == notif_id,
            NotificationDB.recipient_id == current_user.id,
        )
    )).scalar_one_or_none()
    if not notif:
        raise HTTPException(404, "Notification not found")
    await db.delete(notif)
    await db.commit()
    return {"message": "Deleted"}