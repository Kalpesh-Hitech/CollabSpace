"""
Routes/Task/MyTaskAPI.py

GET /my-tasks  — role-aware personal task feed
  • Employee  → tasks assigned to them
  • Manager   → tasks they created
  • Admin     → ALL tasks (with full detail)
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from Core.Config.database import async_get_db
from Models.Task import TaskDB
from Models.Teams import TeamsDB
from Models.Users import UserDB, UserRole
from Schemas.TaskSchemas import TaskDetail, TeamInfo, UserInfo
from Utilies.auth import get_current_user

my_task_router = APIRouter()


async def _enrich(task: TaskDB, db: AsyncSession) -> TaskDetail:
    """Enrich a TaskDB row with team / assignee / creator info."""

    team_info = None
    if task.team_id:
        t = (
            await db.execute(select(TeamsDB).where(TeamsDB.id == task.team_id))
        ).scalar_one_or_none()
        if t:
            team_info = TeamInfo(id=t.id, name=t.name)

    assignee_info = None
    if task.assign_id:
        u = (
            await db.execute(select(UserDB).where(UserDB.id == task.assign_id))
        ).scalar_one_or_none()
        if u:
            assignee_info = UserInfo(id=u.id, name=u.name, email=u.email)

    creator_info = None
    if task.created_by_id:
        c = (
            await db.execute(select(UserDB).where(UserDB.id == task.created_by_id))
        ).scalar_one_or_none()
        if c:
            creator_info = UserInfo(id=c.id, name=c.name, email=c.email)

    return TaskDetail(
        id=task.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        team_id=task.team_id,
        assign_id=task.assign_id,
        created_by_id=task.created_by_id,
        is_deleted=task.is_deleted,
        team=team_info,
        assignee=assignee_info,
        creator=creator_info,
    )


@my_task_router.get("/my-tasks", response_model=List[TaskDetail])
async def get_my_tasks(
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    """
    Returns tasks based on the caller's role:
      - Employee  → tasks where assign_id == current_user.id
      - Manager   → tasks where created_by_id == current_user.id
      - Admin     → all non-deleted tasks
    """
    base = select(TaskDB).where(TaskDB.is_deleted == False)

    if current_user.role == UserRole.ADMIN:
        query = base  # admins see everything

    elif current_user.role == UserRole.MANAGER:
        # manager sees tasks they created
        query = base.where(TaskDB.created_by_id == current_user.id)

    else:
        # employee sees only tasks assigned to them
        query = base.where(TaskDB.assign_id == current_user.id)

    result = await db.execute(query)
    tasks = result.scalars().all()

    enriched = [await _enrich(task, db) for task in tasks]
    return enriched