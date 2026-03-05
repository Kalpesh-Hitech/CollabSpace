from datetime import datetime, UTC
from enum import Enum as PyEnum
import uuid

from sqlalchemy import UUID, Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from Core.Config.database import Base


class NotifType(str, PyEnum):
    TEAM_ASSIGNED   = "team_assigned"    # manager assigned to a new team
    TASK_ASSIGNED   = "task_assigned"    # employee assigned a task
    TASK_CLAIMED    = "task_claimed"     # employee claimed an unassigned task
    TASK_STATUS     = "task_status"      # task status changed
    TEAM_INVITE     = "team_invite"      # invited to join a team
    GENERAL         = "general"


class NotificationDB(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4
    )

    # Who receives this notification
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Who triggered it (nullable — system notifications won't have a sender)
    sender_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    notif_type: Mapped[NotifType] = mapped_column(
        Enum(NotifType), default=NotifType.GENERAL
    )

    title  : Mapped[str] = mapped_column(String(120))
    message: Mapped[str] = mapped_column(Text)

    # Optional references
    team_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True
    )

    # For team invite notifications — links to the specific invite record
    invite_token_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("invite_token.id", ondelete="CASCADE"), nullable=True
    )
    # Store the actual JWT string so frontend can call GET /verify-invite/{token}
    invite_token: Mapped[str] = mapped_column(Text, nullable=True)

    is_read    : Mapped[bool]     = mapped_column(Boolean, default=False)
    created_at : Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC).replace(tzinfo=None)
    )

    # Relationships (lazy load — no back_populates needed for notifications)
    recipient = relationship("UserDB", foreign_keys=[recipient_id])
    sender    = relationship("UserDB", foreign_keys=[sender_id])