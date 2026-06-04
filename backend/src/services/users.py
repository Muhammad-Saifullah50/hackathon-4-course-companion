from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import User


class UserService:
    async def get_or_create(self, user_id: str, email: str, db: AsyncSession) -> User:
        stmt = pg_insert(User).values(id=user_id, email=email)
        stmt = stmt.on_conflict_do_nothing(index_elements=["id"])
        await db.execute(stmt)
        await db.commit()
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one()
