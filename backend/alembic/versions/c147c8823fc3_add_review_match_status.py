"""add review match status

Revision ID: c147c8823fc3
Revises: bfce5f91db09
Create Date: 2026-08-25 13:58:36.484269

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c147c8823fc3'
down_revision: Union[str, Sequence[str], None] = 'bfce5f91db09'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Alembic's autogenerate can't detect native-Postgres-enum value
    # additions, so this has to be hand-written. The existing labels
    # (EXACT/FUZZY/UNMATCHED) are the Python enum *member names*, not
    # their .value strings -- SQLAlchemy's default Enum() mapping uses
    # .name for the native type, so the new label has to match that
    # convention.
    op.execute("ALTER TYPE matchtype ADD VALUE IF NOT EXISTS 'REVIEW'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no ALTER TYPE ... DROP VALUE. Removing an enum label
    # requires rebuilding the type (rename, recreate, cast every
    # dependent column, drop the old type) -- not worth the risk for a
    # downgrade path. Any 'REVIEW' rows would need to be reassigned to
    # another status by hand before attempting that.
    pass
