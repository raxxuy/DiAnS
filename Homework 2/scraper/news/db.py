import asyncpg
from asyncpg.pool import Pool


class Database:
    def __init__(self, user, password, database, host="localhost"):
        self.pool: Pool | None = None
        self.user = user
        self.password = password
        self.database = database
        self.host = host

    async def connect(self):
        self.pool = await asyncpg.create_pool(
            user=self.user,
            password=self.password,
            database=self.database,
            host=self.host,
            min_size=1,
            max_size=15
        )

    async def close(self):
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def create_tables(self):
        queries = [
            """
            CREATE TABLE IF NOT EXISTS News (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                content TEXT[] NOT NULL,
                UNIQUE(title, date)
            );
            """
        ]

        async with self.pool.acquire() as conn:
            for query in queries:
                await conn.execute(query)

    async def add_news(self, title, date, content):
        query = """
            INSERT INTO News (title, date, content)
            VALUES ($1, $2, $3)
            ON CONFLICT (title, date) DO NOTHING
        """

        async with self.pool.acquire() as conn:
            await conn.execute(query, title, date, content)