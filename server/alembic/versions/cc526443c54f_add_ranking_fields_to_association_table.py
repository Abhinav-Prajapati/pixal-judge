"""add_ranking_fields_to_association_table

Revision ID: cc526443c54f
Revises: 0c40df432af5
Create Date: 2025-11-03 00:07:37.047603

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc526443c54f'
down_revision: Union[str, Sequence[str], None] = '0c40df432af5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'image_batch_association',
        sa.Column('quality_rank', sa.Integer(), nullable=True),
        schema='image_clustering'
    )
    op.add_column(
        'image_batch_association',
        sa.Column('ranked_at', sa.DateTime(timezone=True), nullable=True),
        schema='image_clustering'
    )
    op.add_column(
        'image_batch_association',
        sa.Column('ranking_metric', sa.String(50), nullable=True),
        schema='image_clustering'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('image_batch_association', 'ranking_metric', schema='image_clustering')
    op.drop_column('image_batch_association', 'ranked_at', schema='image_clustering')
    op.drop_column('image_batch_association', 'quality_rank', schema='image_clustering')
