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
            CREATE TABLE IF NOT EXISTS news_sentiment (
                id SERIAL PRIMARY KEY,
                issuer_id INT NOT NULL,
                issuer_news_id INT NOT NULL UNIQUE,
                sentiment FLOAT NOT NULL,
                created_at DATE NOT NULL DEFAULT NOW(),
                FOREIGN KEY (issuer_news_id) REFERENCES issuer_news(id),
                FOREIGN KEY (issuer_id) REFERENCES issuer(id)
            );
            """
        ]

        async with self.pool.acquire() as conn:
            for query in queries:
                await conn.execute(query)

    async def get_news_sentiment(self, issuer_news_id):
        query = """
            SELECT sentiment FROM news_sentiment WHERE issuer_news_id = $1
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_news_id)
        
    async def get_unprocessed_news(self):
        query = """
            SELECT i.id, i.content, i.attachments, i.issuer_id
            FROM issuer_news i
                LEFT JOIN news_sentiment ns ON i.id = ns.issuer_news_id
                WHERE ns.id IS NULL AND i.content IS NOT NULL
            """
            
        async with self.pool.acquire() as conn:
            return await conn.fetch(query)

    async def add_news_sentiment(self, issuer_id, issuer_news_id, sentiment):
        query = """
            INSERT INTO news_sentiment (issuer_id, issuer_news_id, sentiment)
            VALUES ($1, $2, $3)
            ON CONFLICT (issuer_news_id) DO NOTHING
        """

        async with self.pool.acquire() as conn:
            await conn.execute(query, issuer_id, issuer_news_id, sentiment)