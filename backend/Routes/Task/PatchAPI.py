from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from Core.Config.database import async_get_db
from Models.Task import TaskDB
from Models.Teams import TeamsDB
from Models.Users import UserDB
from Schemas.BulkTaskSchemas import UpdateTask
from Schemas.TaskSchemas import TaskRead, TaskUpdate, TaskUpdateAssign
from Utilies.auth import RoleChecker
from Models.Notification import NotifType
from Routes.Notification.notify_route import create_notification
from Utilies.helper import send_task_completion_email

task_patch = APIRouter()


@task_patch.patch("/assign_task", response_model=TaskRead)
async def assign_task(
    taskseed: TaskUpdateAssign,
    user: UserDB = Depends(RoleChecker(["admin", "manager"])),
    db: AsyncSession = Depends(async_get_db),
):
    # ── Snapshot user FIRST before any db.commit() expires the ORM object ─────
    user_id   = user.id
    user_name = user.name
    user_role = user.role

    assignee = (await db.execute(
        select(UserDB).where(UserDB.id == taskseed.assign_id, UserDB.is_active == True)
    )).scalars().first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee user not found")

    team = (await db.execute(
        select(TeamsDB).where(TeamsDB.id == taskseed.team_id, TeamsDB.is_deleted == False)
    )).scalars().first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if user_role == "manager" and team.create_by_id != user_id:
        raise HTTPException(status_code=403, detail="You can only assign employees to your own team")

    task = (await db.execute(
        select(TaskDB).where(TaskDB.id == taskseed.task_id, TaskDB.is_deleted == False)
    )).scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.team_id   = taskseed.team_id
    task.assign_id = taskseed.assign_id
    await db.commit()
    await db.refresh(task)

    # ── Snapshot task BEFORE create_notification (it does its own commit) ──────
    task_dict = {
        "id":            task.id,
        "title":         task.title,
        "description":   task.description,
        "priority":      task.priority,
        "status":        task.status,
        "team_id":       task.team_id,
        "created_by_id": task.created_by_id,
        "assign_id":     task.assign_id,
        "is_deleted":    task.is_deleted,
    }
    priority_val = task.priority.value

    if taskseed.assign_id:
        await create_notification(
            db           = db,
            recipient_id = taskseed.assign_id,
            sender_id    = user_id,
            notif_type   = NotifType.TASK_ASSIGNED,
            title        = f'Task assigned to you: "{task_dict["title"]}"',
            message      = (
                f'{user_name} has assigned you the task "{task_dict["title"]}". '
                f'Priority: {priority_val}. Check your tasks to get started.'
            ),
            task_id = task_dict["id"],
            team_id = task_dict["team_id"],
        )

    return task_dict


@task_patch.patch("/update-task", response_model=TaskRead)
async def update_task(
    background_tasks: BackgroundTasks,
    task_data       : TaskUpdate,
    user            : UserDB       = Depends(RoleChecker(["admin", "manager", "employee"])),
    db              : AsyncSession = Depends(async_get_db),
):
    # ── Snapshot user FIRST before any db.commit() expires the ORM object ─────
    user_id    = user.id
    user_name  = user.name
    user_role  = user.role
    user_email = user.email

    task = (await db.execute(
        select(TaskDB).where(TaskDB.id == task_data.task_id, TaskDB.is_deleted == False)
    )).scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.created_by_id != user_id and user_role == "manager":
        raise HTTPException(status_code=403, detail="You can only update your own tasks")

    # Snapshot task fields before mutation
    old_assignee = task.assign_id
    old_status   = task.status
    task_id      = task.id
    task_title   = task.title

    # Email on completion
    if (
        task_data.status
        and task_data.status.lower() == "complete"
        and str(old_status).lower() != "complete"
        and user_role == "employee"
    ):
        background_tasks.add_task(send_task_completion_email, user_email, task_title)

    # Apply updates
    new_assignee_id = None
    if user_role in ("admin", "manager"):
        if task_data.title:
            task.title = task_data.title
            task_title = task_data.title
        if task_data.description is not None:
            task.description = task_data.description
        if task_data.priority:
            task.priority = task_data.priority
        if task_data.team_id:
            task.team_id = task_data.team_id
        if task_data.assign_id and str(task_data.assign_id) != str(old_assignee or ""):
            new_assignee = (await db.execute(
                select(UserDB).where(UserDB.id == task_data.assign_id, UserDB.is_active == True)
            )).scalars().first()
            if not new_assignee:
                raise HTTPException(status_code=404, detail="Assignee user not found")
            task.assign_id  = task_data.assign_id
            new_assignee_id = task_data.assign_id

    if task_data.status:
        task.status = task_data.status

    await db.commit()
    await db.refresh(task)

    # ── Snapshot task BEFORE create_notification (it does its own commit) ──────
    task_dict = {
        "id":            task.id,
        "title":         task.title,
        "description":   task.description,
        "priority":      task.priority,
        "status":        task.status,
        "team_id":       task.team_id,
        "created_by_id": task.created_by_id,
        "assign_id":     task.assign_id,
        "is_deleted":    task.is_deleted,
    }
    priority_val = task.priority.value

    if user_role in ("admin", "manager") and new_assignee_id:
        await create_notification(
            db           = db,
            recipient_id = new_assignee_id,
            sender_id    = user_id,
            notif_type   = NotifType.TASK_ASSIGNED,
            title        = f'Task assigned to you: "{task_title}"',
            message      = (
                f'{user_name} has assigned you the task "{task_title}". '
                f'Priority: {priority_val}. Check your tasks to get started.'
            ),
            task_id = task_id,
            team_id = task_dict["team_id"],
        )

    return task_dict


@task_patch.patch("/bulk-update", response_model=List[TaskRead])
async def bulk_update_tasks(
    updates: List[UpdateTask],
    user   : UserDB       = Depends(RoleChecker(["admin", "manager"])),
    db     : AsyncSession = Depends(async_get_db),
):
    # ── Snapshot user FIRST before any db.commit() expires the ORM object ─────
    user_id   = user.id
    user_name = user.name
    user_role = user.role

    if not updates:
        raise HTTPException(status_code=400, detail="Update list cannot be empty")

    task_ids = [u.task_id for u in updates]
    result   = await db.execute(select(TaskDB).where(TaskDB.id.in_(task_ids)))
    existing = {t.id: t for t in result.scalars().all()}

    if len(existing) != len(task_ids):
        raise HTTPException(status_code=404, detail="Some task IDs were not found")

    reassignments   = []
    updated_objects = []

    for update_data in updates:
        task = existing.get(update_data.task_id)

        if user_role == "manager" and task.created_by_id != user_id:
            raise HTTPException(status_code=403, detail=f"Task {task.id} is not yours to update")

        old_assignee  = task.assign_id
        update_dict   = update_data.model_dump(exclude_unset=True, exclude={"task_id"})
        new_assign_id = update_dict.get("assign_id")

        if new_assign_id and str(new_assign_id) != str(old_assignee or ""):
            new_assignee = (await db.execute(
                select(UserDB).where(UserDB.id == new_assign_id, UserDB.is_active == True)
            )).scalars().first()
            if not new_assignee:
                raise HTTPException(status_code=404, detail=f"Assignee not found for task {task.id}")

            priority_src = update_dict.get("priority") or task.priority
            reassignments.append({
                "recipient_id": new_assign_id,
                "task_id"     : task.id,
                "task_title"  : update_dict.get("title") or task.title,
                "team_id"     : update_dict.get("team_id") or task.team_id,
                "priority"    : priority_src.value if hasattr(priority_src, "value") else str(priority_src),
            })

        for key, value in update_dict.items():
            setattr(task, key, value)

        updated_objects.append(task)

    try:
        await db.commit()
        for t in updated_objects:
            await db.refresh(t)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Bulk update failed")

    # ── Snapshot ALL to dicts BEFORE notification commits expire ORM objects ───
    result_dicts = [
        {
            "id":            t.id,
            "title":         t.title,
            "description":   t.description,
            "priority":      t.priority,
            "status":        t.status,
            "team_id":       t.team_id,
            "created_by_id": t.created_by_id,
            "assign_id":     t.assign_id,
            "is_deleted":    t.is_deleted,
        }
        for t in updated_objects
    ]

    for r in reassignments:
        await create_notification(
            db           = db,
            recipient_id = r["recipient_id"],
            sender_id    = user_id,
            notif_type   = NotifType.TASK_ASSIGNED,
            title        = f'Task assigned to you: "{r["task_title"]}"',
            message      = (
                f'{user_name} has assigned you the task "{r["task_title"]}". '
                f'Priority: {r["priority"]}. Check your tasks to get started.'
            ),
            task_id = r["task_id"],
            team_id = r["team_id"],
        )

    return result_dicts