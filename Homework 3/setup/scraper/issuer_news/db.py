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
            CREATE TABLE IF NOT EXISTS issuer_news (
                id SERIAL PRIMARY KEY,
                seinet_id INT NOT NULL,
                issuer_id INT NOT NULL,
                content TEXT,
                date DATE NOT NULL,
                attachments TEXT[],
                FOREIGN KEY (issuer_id) REFERENCES issuer(id),
                UNIQUE(issuer_id, id)
            );
            """
        ]

        async with self.pool.acquire() as conn:
            for query in queries:
                await conn.execute(query)

    async def add_issuer_news(self, issuer_id, seinet_id, content, date, attachments):
        query = """
            INSERT INTO issuer_news (issuer_id, seinet_id, content, date, attachments)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (issuer_id, id) DO NOTHING
        """

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(query, issuer_id, seinet_id, content, date, attachments)
        except Exception as e:
            print(content, date, attachments)

    async def get_news_id(self, seinet_id):
        query = """
            SELECT id FROM issuer_news WHERE seinet_id = $1
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, seinet_id)

    async def get_issuer_id(self, issuer_code):
        query = """
            SELECT id FROM issuer WHERE code = $1
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_code)

    async def get_issuers(self):
        query = """
            SELECT code FROM issuer
        """

        async with self.pool.acquire() as conn:
            return await conn.fetch(query)
        
      
