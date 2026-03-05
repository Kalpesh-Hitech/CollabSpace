from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from Core.Config.database import async_get_db
from Models.Teams import TeamsDB
from Models.UserTeams import UserTeamsDB
from Models.Users import UserDB, UserRole
from Models.Notification import NotifType
from Schemas.TeamSchemas import TeamCreate, TeamRead
from Utilies.auth import RoleChecker
from Routes.Notification.notify_route import create_notification

team_post = APIRouter()

@team_post.post("/create_team", response_model=TeamRead)
async def create_team(
    teamseed: TeamCreate,
    user    : UserDB       = Depends(RoleChecker(["admin", "manager"])),
    db      : AsyncSession = Depends(async_get_db),
):
    user_role = user.role
    user_id   = user.id
    user_name = user.name

    team_data  = teamseed.model_dump(exclude={"create_by_id"})
    creator_id = teamseed.create_by_id if (user_role == UserRole.ADMIN and teamseed.create_by_id) else user_id

    new_team = TeamsDB(**team_data, create_by_id=creator_id)
    db.add(new_team)
    await db.flush() 

    team_id   = new_team.id
    team_name = new_team.name

    db.add(UserTeamsDB(user_id=creator_id, team_id=team_id))

    await db.commit()
    
    # FIX 1: Explicitly refresh and ensure attributes are loaded
    # This fetches the fresh data from the DB so FastAPI can read it safely
    await db.refresh(new_team)

    should_notify = (
        user_role == UserRole.ADMIN
        and teamseed.create_by_id
        and str(teamseed.create_by_id) != str(user_id)
    )

    if should_notify:
        manager = (
            await db.execute(select(UserDB).where(UserDB.id == teamseed.create_by_id))
        ).scalar_one_or_none()

        if manager:
            manager_id = manager.id
            await create_notification(
                db           = db,
                recipient_id = manager_id,
                sender_id    = user_id,
                notif_type   = NotifType.TEAM_ASSIGNED,
                title        = f'You\'ve been assigned to team "{team_name}"',
                message      = (
                    f'Admin {user_name} created the team "{team_name}" and assigned you as manager.'
                ),
                team_id = team_id,
            )
            # FIX 2: If create_notification does a commit, refresh new_team again 
            # OR just ensure we don't expire it.
            await db.commit() 

    # Re-refresh one last time if notifications caused another expiration
    await db.refresh(new_team) 
    return new_team

@team_post.post("/assignee_teams")
async def assignee_teams(
    data: dict,
    user: UserDB       = Depends(RoleChecker(["admin", "manager"])),
    db  : AsyncSession = Depends(async_get_db),
):
    """Add a user to a team and send them a notification."""
    # ── Read user fields before any commit ──────────────────────────────────
    user_id   = user.id
    user_name = user.name

    team_id = data.get("team_id")
    user_target_id = data.get("user_id")

    if not team_id or not user_target_id:
        raise HTTPException(400, "team_id and user_id are required")

    team = (await db.execute(
        select(TeamsDB).where(TeamsDB.id == team_id, TeamsDB.is_deleted == False)
    )).scalar_one_or_none()
    if not team:
        raise HTTPException(404, "Team not found")

    member = (await db.execute(
        select(UserDB).where(UserDB.id == user_target_id, UserDB.is_active == True)
    )).scalar_one_or_none()
    if not member:
        raise HTTPException(404, "User not found")

    # Read all fields before commit
    team_name  = team.name
    member_id  = member.id

    db.add(UserTeamsDB(user_id=user_target_id, team_id=team_id))
    await db.commit()

    # Notify the added member (all values are plain Python — no ORM access after commit)
    await create_notification(
        db           = db,
        recipient_id = member_id,
        sender_id    = user_id,
        notif_type   = NotifType.TEAM_INVITE,
        title        = f'You\'ve been added to team "{team_name}"',
        message      = (
            f'{user_name} has added you to the team "{team_name}". '
            f'You can now receive task assignments from this team.'
        ),
        team_id = team_id,
    )

    return {"message": "User added to team", "team_id": str(team_id), "user_id": str(user_target_id)}