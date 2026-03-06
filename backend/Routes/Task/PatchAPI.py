from typing import List

from fastapi import APIRouter, BackgroundTasks,Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from Core.Config.database import async_get_db
from Models.Task import TaskDB
from Models.Teams import TeamsDB
from Models.Users import UserDB
from Schemas.BulkTaskSchemas import UpdateTask
from Schemas.TaskSchemas import TaskCreate, TaskRead, TaskUpdate, TaskUpdateAssign
from Utilies.auth import RoleChecker
from Models.Notification import NotifType
from Routes.Notification.notify_route import create_notification
from Utilies.helper import send_task_completion_email
task_patch=APIRouter()

@task_patch.patch("/assign_task",response_model=TaskRead)
async def assign_task(taskseed:TaskUpdateAssign,user:UserDB=Depends(RoleChecker(["admin", "manager"])),db:AsyncSession=Depends(async_get_db)):
    
    query = select(UserDB).where(
        UserDB.id==taskseed.assign_id,
        UserDB.is_active==True
    )
    result = await db.execute(query)
    existing_record = result.scalars().first()
    if not existing_record:
        raise HTTPException(status_code=404, detail="wrong assign id")
    query = select(TeamsDB).where(
        TeamsDB.id==taskseed.team_id,
        TeamsDB.is_deleted==False
    )
    result = await db.execute(query)
    existing_record = result.scalars().first()
    if not existing_record:
        raise HTTPException(status_code=404, detail="wrong team id")
    if existing_record.create_by_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only assign employees to your own team",
        )
    query = select(TaskDB).where(
        TaskDB.id==taskseed.task_id,
        TaskDB.is_deleted==False
    )
    result = await db.execute(query)
    existing_record = result.scalars().first()
    if not existing_record:
        raise HTTPException(status_code=404, detail="wrong task id")
    # Allow reassignment — overwrite existing team/assign
    existing_record.team_id  = taskseed.team_id
    existing_record.assign_id = taskseed.assign_id
    await db.commit()

    # Notify the assignee
    if taskseed.assign_id:
        await create_notification(
            db           = db,
            recipient_id = taskseed.assign_id,
            sender_id    = user.id,
            notif_type   = NotifType.TASK_ASSIGNED,
            title        = f'Task assigned to you: "{existing_record.title}"',
            message      = (
                f'{user.name} has assigned you the task "{existing_record.title}". '
                f'Priority: {existing_record.priority.value}. Check your tasks to get started.'
            ),
            task_id = existing_record.id,
            team_id = taskseed.team_id,
        )

    return existing_record
@task_patch.patch("/update-task", response_model=TaskRead)
async def update_task(
    background_tasks: BackgroundTasks,
    task_data       : TaskUpdate,
    user            : UserDB       = Depends(RoleChecker(["admin", "manager", "employee"])),
    db              : AsyncSession = Depends(async_get_db),
):
    task = (await db.execute(
        select(TaskDB).where(TaskDB.id == task_data.task_id, TaskDB.is_deleted == False)
    )).scalars().first()

    if not task:
        raise HTTPException(status_code=404, detail="task nhi h")

    if task.created_by_id != user.id and user.role == "manager":
        raise HTTPException(status_code=403, detail="apna task dekho bhai, dusre me nhi aana")

    # ── Read fields BEFORE any commit ─────────────────────────────────────────
    user_email    = user.email
    user_id       = user.id
    user_name     = user.name
    user_role     = user.role
    old_assignee  = task.assign_id   # track if reassignment happens
    old_status    = task.status
    task_id       = task.id
    task_title    = task.title       # used in notification if title not changing

    # ── Email trigger: employee marking task complete ─────────────────────────
    if (
        task_data.status
        and task_data.status.lower() == "complete"
        and str(old_status).lower() != "complete"
        and user_role == "employee"
    ):
        background_tasks.add_task(send_task_completion_email, user_email, task_title)

    # ── Apply field updates ───────────────────────────────────────────────────
    if user_role in ("admin", "manager"):
        if task_data.title:
            task.title       = task_data.title
            task_title       = task_data.title   # keep in sync for notification
        if task_data.description:
            task.description = task_data.description
        if task_data.priority:
            task.priority    = task_data.priority
        if task_data.team_id:
            task.team_id     = task_data.team_id

        # ── Reassign logic ────────────────────────────────────────────────────
        if task_data.assign_id and str(task_data.assign_id) != str(old_assignee or ""):
            # Validate new assignee exists
            new_assignee = (await db.execute(
                select(UserDB).where(
                    UserDB.id == task_data.assign_id,
                    UserDB.is_active == True,
                )
            )).scalars().first()
            if not new_assignee:
                raise HTTPException(status_code=404, detail="Assignee user not found")

            task.assign_id    = task_data.assign_id
            new_assignee_id   = new_assignee.id   # plain var before commit

    if task_data.status:
        task.status = task_data.status

    await db.commit()
    await db.refresh(task)

    # ── Notify new assignee if reassigned ─────────────────────────────────────
    # All values are plain Python — safe after commit
    if (
        user_role in ("admin", "manager")
        and task_data.assign_id
        and str(task_data.assign_id) != str(old_assignee or "")
    ):
        task_priority_val = task.priority.value  # safe — just refreshed
        await create_notification(
            db           = db,
            recipient_id = task_data.assign_id,
            sender_id    = user_id,
            notif_type   = NotifType.TASK_ASSIGNED,
            title        = f'Task assigned to you: "{task_title}"',
            message      = (
                f'{user_name} has assigned you the task "{task_title}". '
                f'Priority: {task_priority_val}. Check your tasks to get started.'
            ),
            task_id = task_id,
            team_id = task.team_id,
        )

    return task


# ── PATCH /bulk-update ────────────────────────────────────────────────────────
@task_patch.patch("/bulk-update", response_model=List[TaskRead])
async def bulk_update_tasks(
    updates: List[UpdateTask],
    user   : UserDB       = Depends(RoleChecker(["admin", "manager"])),
    db     : AsyncSession = Depends(async_get_db),
):
    if not updates:
        raise HTTPException(status_code=400, detail="Update list cannot be empty")

    # ── Read user fields before any commit ───────────────────────────────────
    user_id   = user.id
    user_name = user.name
    user_role = user.role

    task_ids = [u.task_id for u in updates]
    result   = await db.execute(select(TaskDB).where(TaskDB.id.in_(task_ids)))
    existing = {t.id: t for t in result.scalars().all()}

    if len(existing) != len(task_ids):
        raise HTTPException(status_code=404, detail="Kuch task IDs database mein nahi mile")

    # ── Track reassignments BEFORE applying changes ───────────────────────────
    # We need old assign_id per task to detect actual reassignments
    reassignments = []   # list of (new_assign_id, task_id, task_title, team_id, priority)

    updated_objects = []
    for update_data in updates:
        task = existing.get(update_data.task_id)

        if user_role == "manager" and task.created_by_id != user_id:
            raise HTTPException(
                status_code=403,
                detail=f"Task {task.id} aapki nahi hai, update nahi kar sakte",
            )

        old_assignee = task.assign_id

        # Validate new assignee if being reassigned
        update_dict = update_data.model_dump(exclude_unset=True, exclude={"task_id"})
        new_assign_id = update_dict.get("assign_id")

        if new_assign_id and str(new_assign_id) != str(old_assignee or ""):
            new_assignee = (await db.execute(
                select(UserDB).where(
                    UserDB.id == new_assign_id,
                    UserDB.is_active == True,
                )
            )).scalars().first()
            if not new_assignee:
                raise HTTPException(
                    status_code=404,
                    detail=f"Assignee not found for task {task.id}",
                )
            # Snapshot everything needed for notification (before commit expires objects)
            reassignments.append({
                "recipient_id": new_assign_id,
                "task_id"     : task.id,
                "task_title"  : update_dict.get("title") or task.title,
                "team_id"     : update_dict.get("team_id") or task.team_id,
                "priority"    : (update_dict.get("priority") or task.priority).value
                                if hasattr((update_dict.get("priority") or task.priority), "value")
                                else str(update_dict.get("priority") or task.priority),
            })

        # Apply all field updates
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

    # ── Send reassignment notifications (after commit, using plain vars only) ─
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

    return updated_objects