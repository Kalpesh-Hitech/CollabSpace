"""
Routes/Analytics/analytics_route.py

Analytics & Reports endpoints — role-aware dashboards.

GET /analytics/overview        → high-level counts (tasks, teams, users)
GET /analytics/task-breakdown  → tasks grouped by status / priority
GET /analytics/team-performance → per-team task completion stats
GET /analytics/user-workload   → per-user task counts (admin / manager)
GET /reports/tasks             → paginated, filterable task report
GET /reports/team/{team_id}    → detailed single-team report
"""

from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from Core.Config.database import async_get_db
from Models.Task import TaskDB, StatusBased, PriorityBased
from Models.Teams import TeamsDB
from Models.Users import UserDB, UserRole
from Models.UserTeams import UserTeamsDB
from Utilies.auth import get_current_user

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])
reports_router   = APIRouter(prefix="/reports",   tags=["Reports"])


# ─── Pydantic response models ────────────────────────────────────────────────

class OverviewStats(BaseModel):
    total_tasks:   int
    total_teams:   int
    total_users:   int
    todo_tasks:    int
    doing_tasks:   int
    complete_tasks: int


class StatusBreakdown(BaseModel):
    status: str
    count:  int


class PriorityBreakdown(BaseModel):
    priority: str
    count:    int


class TaskBreakdownResponse(BaseModel):
    by_status:   List[StatusBreakdown]
    by_priority: List[PriorityBreakdown]


class TeamPerformance(BaseModel):
    team_id:        UUID
    team_name:      str
    total_tasks:    int
    complete_tasks: int
    doing_tasks:    int
    todo_tasks:     int
    completion_rate: float   # 0-100


class UserWorkload(BaseModel):
    user_id:        UUID
    user_name:      str
    user_email:     EmailStr
    total_tasks:    int
    complete_tasks: int
    doing_tasks:    int
    todo_tasks:     int


class TaskReportItem(BaseModel):
    id:           UUID
    title:        str
    status:       str
    priority:     str
    team_name:    Optional[str]
    assignee_name: Optional[str]
    creator_name: Optional[str]


class TeamReportResponse(BaseModel):
    team_id:         UUID
    team_name:       str
    manager_name:    str
    manager_email:   EmailStr
    total_tasks:     int
    complete_tasks:  int
    member_count:    int
    members:         List[UserWorkload]


# ─── Helper: restrict query to what the current user is allowed to see ───────

def _task_scope(current_user: UserDB, query):
    """Filter a TaskDB query based on role."""
    if current_user.role == UserRole.ADMIN:
        return query
    if current_user.role == UserRole.MANAGER:
        return query.where(TaskDB.created_by_id == current_user.id)
    # Employee
    return query.where(TaskDB.assign_id == current_user.id)


def _team_scope(current_user: UserDB, query):
    """Filter a TeamsDB query based on role."""
    if current_user.role == UserRole.ADMIN:
        return query
    if current_user.role == UserRole.MANAGER:
        return query.where(TeamsDB.create_by_id == current_user.id)
    # Employee — teams they belong to
    return query.join(
        UserTeamsDB, TeamsDB.id == UserTeamsDB.team_id
    ).where(UserTeamsDB.user_id == current_user.id)


# ─── /analytics/overview ─────────────────────────────────────────────────────

@analytics_router.get("/overview", response_model=OverviewStats)
async def get_overview(
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    base_task = _task_scope(current_user, select(TaskDB).where(TaskDB.is_deleted == False))
    base_team = _team_scope(current_user, select(TeamsDB).where(TeamsDB.is_deleted == False))

    total_tasks   = (await db.execute(select(func.count()).select_from(base_task.subquery()))).scalar()
    total_teams   = (await db.execute(select(func.count()).select_from(base_team.subquery()))).scalar()

    # Users count — admin sees all; others see teammates
    if current_user.role == UserRole.ADMIN:
        total_users = (await db.execute(select(func.count(UserDB.id)))).scalar()
    elif current_user.role == UserRole.MANAGER:
        subq = select(UserTeamsDB.user_id).join(
            TeamsDB, UserTeamsDB.team_id == TeamsDB.id
        ).where(TeamsDB.create_by_id == current_user.id)
        total_users = (await db.execute(select(func.count()).select_from(subq.subquery()))).scalar()
    else:
        subq = select(UserTeamsDB.user_id).where(UserTeamsDB.user_id == current_user.id)
        total_users = 1

    # Status counts
    status_q = _task_scope(
        current_user,
        select(TaskDB.status, func.count(TaskDB.id))
        .where(TaskDB.is_deleted == False)
        .group_by(TaskDB.status),
    )
    rows = (await db.execute(status_q)).all()
    status_map = {r[0].value: r[1] for r in rows}

    return OverviewStats(
        total_tasks    = total_tasks   or 0,
        total_teams    = total_teams   or 0,
        total_users    = total_users   or 0,
        todo_tasks     = status_map.get("todo", 0),
        doing_tasks    = status_map.get("doing", 0),
        complete_tasks = status_map.get("complete", 0),
    )


# ─── /analytics/task-breakdown ───────────────────────────────────────────────

@analytics_router.get("/task-breakdown", response_model=TaskBreakdownResponse)
async def get_task_breakdown(
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    base = select(TaskDB).where(TaskDB.is_deleted == False)

    # Status
    status_q = _task_scope(
        current_user,
        select(TaskDB.status, func.count(TaskDB.id))
        .where(TaskDB.is_deleted == False)
        .group_by(TaskDB.status),
    )
    s_rows = (await db.execute(status_q)).all()

    # Priority
    priority_q = _task_scope(
        current_user,
        select(TaskDB.priority, func.count(TaskDB.id))
        .where(TaskDB.is_deleted == False)
        .group_by(TaskDB.priority),
    )
    p_rows = (await db.execute(priority_q)).all()

    return TaskBreakdownResponse(
        by_status   = [StatusBreakdown(status=r[0].value, count=r[1]) for r in s_rows],
        by_priority = [PriorityBreakdown(priority=r[0].value, count=r[1]) for r in p_rows],
    )


# ─── /analytics/team-performance ─────────────────────────────────────────────

@analytics_router.get("/team-performance", response_model=List[TeamPerformance])
async def get_team_performance(
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    team_q = _team_scope(
        current_user,
        select(TeamsDB).where(TeamsDB.is_deleted == False),
    )
    teams = (await db.execute(team_q)).scalars().all()

    result = []
    for team in teams:
        counts = {}
        for status in StatusBased:
            c = (await db.execute(
                select(func.count(TaskDB.id)).where(
                    TaskDB.team_id == team.id,
                    TaskDB.status == status,
                    TaskDB.is_deleted == False,
                )
            )).scalar() or 0
            counts[status.value] = c

        total = sum(counts.values())
        rate  = round(counts.get("complete", 0) / total * 100, 1) if total else 0.0

        result.append(TeamPerformance(
            team_id         = team.id,
            team_name       = team.name,
            total_tasks     = total,
            complete_tasks  = counts.get("complete", 0),
            doing_tasks     = counts.get("doing", 0),
            todo_tasks      = counts.get("todo", 0),
            completion_rate = rate,
        ))

    return result


# ─── /analytics/user-workload ────────────────────────────────────────────────

@analytics_router.get("/user-workload", response_model=List[UserWorkload])
async def get_user_workload(
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    if current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Access denied")

    if current_user.role == UserRole.ADMIN:
        users = (await db.execute(
            select(UserDB).where(UserDB.is_active == True)
        )).scalars().all()
    else:
        # Manager: employees in their teams
        subq = select(UserTeamsDB.user_id).join(
            TeamsDB, UserTeamsDB.team_id == TeamsDB.id
        ).where(TeamsDB.create_by_id == current_user.id)
        users = (await db.execute(
            select(UserDB).where(UserDB.id.in_(subq), UserDB.is_active == True)
        )).scalars().all()

    result = []
    for u in users:
        counts = {}
        for status in StatusBased:
            c = (await db.execute(
                select(func.count(TaskDB.id)).where(
                    TaskDB.assign_id == u.id,
                    TaskDB.status == status,
                    TaskDB.is_deleted == False,
                )
            )).scalar() or 0
            counts[status.value] = c

        result.append(UserWorkload(
            user_id        = u.id,
            user_name      = u.name,
            user_email     = u.email,
            total_tasks    = sum(counts.values()),
            complete_tasks = counts.get("complete", 0),
            doing_tasks    = counts.get("doing", 0),
            todo_tasks     = counts.get("todo", 0),
        ))

    return result


# ─── /reports/tasks ──────────────────────────────────────────────────────────

@reports_router.get("/tasks", response_model=List[TaskReportItem])
async def report_tasks(
    status:   Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    team_id:  Optional[UUID] = Query(None),
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    base = select(TaskDB).where(TaskDB.is_deleted == False)

    if status:
        base = base.where(TaskDB.status == status)
    if priority:
        base = base.where(TaskDB.priority == priority)
    if team_id:
        base = base.where(TaskDB.team_id == team_id)

    scoped = _task_scope(current_user, base)
    tasks  = (await db.execute(scoped)).scalars().all()

    items = []
    for task in tasks:
        team_name    = None
        assignee_name = None
        creator_name  = None

        if task.team_id:
            t = (await db.execute(select(TeamsDB).where(TeamsDB.id == task.team_id))).scalar_one_or_none()
            team_name = t.name if t else None

        if task.assign_id:
            u = (await db.execute(select(UserDB).where(UserDB.id == task.assign_id))).scalar_one_or_none()
            assignee_name = u.name if u else None

        if task.created_by_id:
            c = (await db.execute(select(UserDB).where(UserDB.id == task.created_by_id))).scalar_one_or_none()
            creator_name = c.name if c else None

        items.append(TaskReportItem(
            id            = task.id,
            title         = task.title,
            status        = task.status.value,
            priority      = task.priority.value,
            team_name     = team_name,
            assignee_name = assignee_name,
            creator_name  = creator_name,
        ))

    return items


# ─── /reports/team/{team_id} ─────────────────────────────────────────────────

@reports_router.get("/team/{team_id}", response_model=TeamReportResponse)
async def report_team(
    team_id: UUID,
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(get_current_user),
):
    team = (await db.execute(
        select(TeamsDB).where(TeamsDB.id == team_id, TeamsDB.is_deleted == False)
    )).scalar_one_or_none()

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Access control
    if current_user.role == UserRole.MANAGER and team.create_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.EMPLOYEE:
        mem = (await db.execute(
            select(UserTeamsDB).where(
                UserTeamsDB.team_id == team_id,
                UserTeamsDB.user_id == current_user.id,
            )
        )).scalar_one_or_none()
        if not mem:
            raise HTTPException(status_code=403, detail="Access denied")

    manager = (await db.execute(select(UserDB).where(UserDB.id == team.create_by_id))).scalar_one()

    members_raw = (await db.execute(
        select(UserDB).join(UserTeamsDB, UserDB.id == UserTeamsDB.user_id)
        .where(UserTeamsDB.team_id == team_id)
    )).scalars().all()

    member_workloads = []
    total_complete = 0
    for u in members_raw:
        counts = {}
        for status in StatusBased:
            c = (await db.execute(
                select(func.count(TaskDB.id)).where(
                    TaskDB.assign_id == u.id,
                    TaskDB.team_id == team_id,
                    TaskDB.status == status,
                    TaskDB.is_deleted == False,
                )
            )).scalar() or 0
            counts[status.value] = c
        total_complete += counts.get("complete", 0)
        member_workloads.append(UserWorkload(
            user_id        = u.id,
            user_name      = u.name,
            user_email     = u.email,
            total_tasks    = sum(counts.values()),
            complete_tasks = counts.get("complete", 0),
            doing_tasks    = counts.get("doing", 0),
            todo_tasks     = counts.get("todo", 0),
        ))

    total_tasks = (await db.execute(
        select(func.count(TaskDB.id)).where(
            TaskDB.team_id == team_id, TaskDB.is_deleted == False
        )
    )).scalar() or 0

    return TeamReportResponse(
        team_id        = team.id,
        team_name      = team.name,
        manager_name   = manager.name,
        manager_email  = manager.email,
        total_tasks    = total_tasks,
        complete_tasks = total_complete,
        member_count   = len(members_raw),
        members        = member_workloads,
    )