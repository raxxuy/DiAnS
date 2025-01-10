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
                shared_id INTEGER NOT NULL,
                locale VARCHAR(2) NOT NULL,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                content TEXT[] NOT NULL,
                UNIQUE(shared_id, locale)
            );
            """
        ]

        async with self.pool.acquire() as conn:
            for query in queries:
                await conn.execute(query)

    async def add_news(self, title, date, content, locale):
        query = """
            WITH inserted AS (
                INSERT INTO News (shared_id, title, date, content, locale)
                VALUES (COALESCE((SELECT MAX(id) FROM News), 0) + 1, $1, $2, $3, $4)
                ON CONFLICT (shared_id, locale) DO UPDATE SET
                    date = EXCLUDED.date,
                    content = EXCLUDED.content
                RETURNING shared_id
            )
            SELECT shared_id FROM inserted
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, title, date, content, locale)

    async def add_news_mk(self, shared_id, title, date, content):
        query = """
            INSERT INTO News (shared_id, title, date, content, locale)
            VALUES ($1, $2, $3, $4, 'mk')
            ON CONFLICT (shared_id, locale) DO NOTHING
        """

        async with self.pool.acquire() as conn:
            await conn.execute(query, shared_id, title, date, content)

    async def get_news(self, title, date, content):
        query = """
            SELECT * FROM News WHERE title = $1 AND date = $2 AND content = $3
        """

        async with self.pool.acquire() as conn:
            return await conn.fetch(query, title, date, content)
