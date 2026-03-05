from fastapi import HTTPException
from uuid import UUID
from Models.Task import StatusBased, TaskDB
from Models.Teams import TeamsDB
from Models.UserTeams import UserTeamsDB
from Models.Users import UserDB, UserRole
from Schemas.UserSchemas import UserRead
from Utilies.auth import RoleChecker, get_current_user
from fastapi import APIRouter, Depends
from Core.Config.database import async_get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select


userRouter = APIRouter()


@userRouter.get("/me", response_model=UserRead)
async def get_me(
    user: UserDB = Depends(RoleChecker(["admin", "manager", "employee"])),
    db: AsyncSession = Depends(async_get_db),
):
    return user


@userRouter.get("/all", response_model=list[UserRead])
async def get_all_users(
    user: UserDB = Depends(RoleChecker(["admin"])),
    db: AsyncSession = Depends(async_get_db),
):
    query = select(UserDB)
    result = await db.execute(query)
    result = result.scalars().all()
    return result




@userRouter.get("/list/managers", response_model=list[UserRead])
async def list_managers(
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(RoleChecker(["admin"])),
):
    query = select(UserDB).where(
        UserDB.role == UserRole.MANAGER, UserDB.is_active == True
    )
    result = await db.execute(query)
    return result.scalars().all()


@userRouter.get("/employees", response_model=list[UserRead])
async def get_all_employees(
    db: AsyncSession = Depends(async_get_db),
    current_user: UserDB = Depends(RoleChecker(["admin", "manager"])),
):
    """
    Returns a list of all active users with the 'employee' role.
    """
    query = select(UserDB).where(
        UserDB.role == UserRole.EMPLOYEE, UserDB.is_active == True
    )
    result = await db.execute(query)
    employees = result.scalars().all()
    return employees


@userRouter.get("/{user_id}", response_model=UserRead)
async def get_user_by_id(
    user_id: UUID,
    user: UserDB = Depends(RoleChecker(["admin", "manager"])),
    db: AsyncSession = Depends(async_get_db),
):
    query = select(UserDB).where(UserDB.id == user_id, UserDB.is_active == True)
    result = await db.execute(query)
    result = result.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="user nhi h")
    return result
