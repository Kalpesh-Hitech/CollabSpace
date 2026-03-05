from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional, List

from Core.Config.database import async_get_db
from Models.Task import TaskDB, PriorityBased, StatusBased
from Models.Teams import TeamsDB
from Models.Users import UserDB, UserRole
from Models.UserTeams import UserTeamsDB
from Schemas.TaskSchemas import TaskDetail, TeamInfo, UserInfo
from Utilies.auth import get_current_user, RoleChecker

task_get = APIRouter()


# ── Rich response schema with team + assignee info ────────────────────────────

@task_get.get("/tasks/stats")
async def get_task_stats(
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    base_query = select(TaskDB.status, func.count(TaskDB.id)).where(
        TaskDB.is_deleted == False
    )

    if current_user.role == UserRole.ADMIN:
        query = base_query.group_by(TaskDB.status)

    elif current_user.role == UserRole.MANAGER:
        subquery = select(TeamsDB.id).where(
            TeamsDB.create_by_id == current_user.id,
            TeamsDB.is_deleted == False,
        )

        query = base_query.where(TaskDB.team_id.in_(subquery)).group_by(TaskDB.status)

    else:
        subquery = select(UserTeamsDB.team_id).where(
            UserTeamsDB.user_id == current_user.id
        )

        query = base_query.where(TaskDB.team_id.in_(subquery)).group_by(TaskDB.status)

    result = await db.execute(query)
    rows = result.all()

    stats = {status.value: 0 for status in StatusBased}

    for status, count in rows:
        stats[status.value] = count

    return stats

@task_get.get("/tasks", response_model=List[TaskDetail])
async def list_tasks(
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    print("hello")
    """
    Returns tasks based on role:
    - Admin   → all tasks
    - Manager → tasks they created
    - Employee→ tasks assigned to them
    """
    base = select(TaskDB).where(TaskDB.is_deleted == False)

    if current_user.role == UserRole.ADMIN:
        query = base
    elif current_user.role == UserRole.MANAGER:
        query = base.where(TaskDB.created_by_id == current_user.id)
    else:
        # Employee sees only tasks assigned to them
        query = base.where(TaskDB.assign_id == current_user.id)

    result = await db.execute(query)
    tasks = result.scalars().all()

    # Enrich with team + assignee + creator info
    enriched = []
    for task in tasks:
        team_info = None
        if task.team_id:
            t = (await db.execute(select(TeamsDB).where(TeamsDB.id == task.team_id))).scalar_one_or_none()
            if t:
                team_info = TeamInfo(id=t.id, name=t.name)

        assignee_info = None
        if task.assign_id:
            u = (await db.execute(select(UserDB).where(UserDB.id == task.assign_id))).scalar_one_or_none()
            if u:
                assignee_info = UserInfo(id=u.id, name=u.name, email=u.email)

        creator_info = None
        if task.created_by_id:
            c = (await db.execute(select(UserDB).where(UserDB.id == task.created_by_id))).scalar_one_or_none()
            if c:
                creator_info = UserInfo(id=c.id, name=c.name, email=c.email)

        enriched.append(TaskDetail(
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
        ))

    return enriched


@task_get.get("/tasks/{task_id}", response_model=TaskDetail)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    task = (
        await db.execute(select(TaskDB).where(TaskDB.id == task_id, TaskDB.is_deleted == False))
    ).scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Access control
    if current_user.role == UserRole.EMPLOYEE and task.assign_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.MANAGER and task.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    team_info = None
    if task.team_id:
        t = (await db.execute(select(TeamsDB).where(TeamsDB.id == task.team_id))).scalar_one_or_none()
        if t:
            team_info = TeamInfo(id=t.id, name=t.name)

    assignee_info = None
    if task.assign_id:
        u = (await db.execute(select(UserDB).where(UserDB.id == task.assign_id))).scalar_one_or_none()
        if u:
            assignee_info = UserInfo(id=u.id, name=u.name, email=u.email)

    creator_info = None
    if task.created_by_id:
        c = (await db.execute(select(UserDB).where(UserDB.id == task.created_by_id))).scalar_one_or_none()
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