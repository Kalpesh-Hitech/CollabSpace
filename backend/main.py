from fastapi import FastAPI
from Exception.exception import (
    integrity_exception_handler,
    global_exception_handler,
    request_validation_exception_handler,
    response_validation_exception_handler,
)

from Routes.User.PostAPI import create_router
from Routes.User.GetAPI import userRouter
from Routes.Task.PostAPI import task_post
from Routes.Task.PatchAPI import task_patch
from Routes.Team.PostAPI import team_post
from Routes.Team.UpdateAPI import team_patch
from Routes.Team.GetAPI import get_teamrouter
from Routes.Team.DeleteAPI import delete_teamrouter
from Routes.Task.DeleteAPI import delete_taskrouter
from Routes.User.PatchAPI import userUpdateRouter
from sqlalchemy.exc import IntegrityError
from Routes.AdminCreate import admin_router
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from Routes.AuthLogic.router import router
from fastapi.middleware.cors import CORSMiddleware
from Routes.Task.GetAPI import task_get
from Routes.MyTask.GetAPI import my_task_router          # ← NEW
from Routes.Notification.notify_route import notif_router
from Routes.Analytics.GetAPI import analytics_router, reports_router  # ← NEW

app = FastAPI()
app.add_exception_handler(IntegrityError, integrity_exception_handler)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://collab-space-steel.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_exception_handler(Exception, global_exception_handler)

# 1. AUTH / LOGIN ROUTES
app.include_router(router)

# 2. TEAM ROUTES
app.include_router(admin_router)
app.include_router(get_teamrouter)
app.include_router(team_post)
app.include_router(team_patch)
app.include_router(delete_teamrouter)

# 3. TASK ROUTES
app.include_router(task_post)
app.include_router(task_patch)
app.include_router(delete_taskrouter)
app.include_router(my_task_router)   # GET /my-tasks  ← NEW (before generic task_get)
app.include_router(task_get)         # GET /tasks and /tasks/{task_id}

# 4. NOTIFICATION ROUTES
app.include_router(notif_router)

# 5. ANALYTICS & REPORTS  ← NEW
app.include_router(analytics_router)
app.include_router(reports_router)

# 6. USER ROUTES — /{user_id} catch-all must remain last
app.include_router(userUpdateRouter)
app.include_router(create_router)
app.include_router(userRouter)