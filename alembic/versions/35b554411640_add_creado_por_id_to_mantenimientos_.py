"""Add creado_por_id to mantenimientos table

Revision ID: 35b554411640
Revises: 995e8ede0130
Create Date: 2025-04-17 11:41:59.128074

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35b554411640'
down_revision: Union[str, None] = '995e8ede0130'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('mantenimientos', sa.Column('creado_por_id', sa.Integer(), nullable=False))
    op.create_foreign_key(None, 'mantenimientos', 'usuarios', ['creado_por_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'mantenimientos', type_='foreignkey')
    op.drop_column('mantenimientos', 'creado_por_id')
    # ### end Alembic commands ###
