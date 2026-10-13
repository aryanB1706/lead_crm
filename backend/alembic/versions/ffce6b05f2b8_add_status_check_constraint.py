"""add status check constraint

Revision ID: ffce6b05f2b8
Revises: e91923747131
Create Date: 2026-10-14 10:56:26.528128

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ffce6b05f2b8'
down_revision: Union[str, Sequence[str], None] = 'e91923747131'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Hand-reviewed: ensure VARCHAR status has explicit CHECK (Enum native_enum=False
    # should also create one, but we enforce it explicitly per spec).
    op.create_check_constraint(
        "ck_leads_status",
        "leads",
        "status IN ('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_leads_status", "leads", type_="check")
