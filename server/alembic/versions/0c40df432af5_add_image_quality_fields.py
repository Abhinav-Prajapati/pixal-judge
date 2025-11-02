"""add_image_quality_fields

Revision ID: 0c40df432af5
Revises: 487c42b05f95
Create Date: 2025-11-02 23:19:43.581884

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c40df432af5'
down_revision: Union[str, Sequence[str], None] = '487c42b05f95'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'images',
        sa.Column('quality_score', sa.Float(), nullable=True),
        schema='image_clustering'
    )
    op.add_column(
        'images',
        sa.Column('quality_metric', sa.String(50), nullable=True),
        schema='image_clustering'
    )
    op.add_column(
        'images',
        sa.Column('quality_analyzed_at', sa.DateTime(timezone=True), nullable=True),
        schema='image_clustering'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('images', 'quality_analyzed_at', schema='image_clustering')
    op.drop_column('images', 'quality_metric', schema='image_clustering')
    op.drop_column('images', 'quality_score', schema='image_clustering')
