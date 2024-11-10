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
            min_size=1
        )

    async def close(self):
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def create_tables(self):
        queries = [
            """
            CREATE TABLE IF NOT EXISTS Company (
                id SERIAL PRIMARY KEY,
                code VARCHAR(20) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                address VARCHAR(100),
                city VARCHAR(50),
                state VARCHAR(50),
                email VARCHAR(100),
                website VARCHAR(100),
                contact_person VARCHAR(100),
                phones VARCHAR(50)[],
                fax VARCHAR(50)[]
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS Issuer (
                id SERIAL PRIMARY KEY,
                code VARCHAR(20) UNIQUE NOT NULL,
                company_id INTEGER REFERENCES Company(id) ON DELETE CASCADE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS StockHistory (
                id SERIAL PRIMARY KEY,
                issuer_id INTEGER NOT NULL REFERENCES Issuer(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                last_trade_price VARCHAR(255) NOT NULL,
                max_price VARCHAR(255) NOT NULL,
                min_price VARCHAR(255) NOT NULL,
                avg_price VARCHAR(255) NOT NULL,
                percent_change VARCHAR(255) NOT NULL,
                volume VARCHAR(255) NOT NULL,
                turnover_best VARCHAR(255) NOT NULL,
                total_turnover VARCHAR(255) NOT NULL,
                CONSTRAINT unique_stock_entry UNIQUE (issuer_id, date)
            );
            """
        ]

        async with self.pool.acquire() as conn:
            for query in queries:
                await conn.execute(query)

    async def add_company(self, code, name, address=None, city=None, state=None, email=None, website=None, contact_person=None, phones=None, fax=None):
        query = """
            INSERT INTO Company (code, name, address, city, state, email, website, contact_person, phones, fax)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, code, name, address, city, state, email, website, contact_person, phones, fax)

    async def add_issuer(self, code, company_id):
        query = """
            INSERT INTO Issuer (code, company_id)
            VALUES ($1, $2)
            RETURNING id;
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, code, company_id)

    async def add_stock_entry(self, issuer_id, date, last_trade_price, _max, _min, avg_price, percent_change, volume, turnover_best, total_turnover):
        query = """
            INSERT INTO StockHistory (issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_id, date, last_trade_price, _max, _min, avg_price, percent_change, volume, turnover_best, total_turnover)

    async def assign_issuer(self, issuer_code, company_data):
        company_id = await self.add_company(*company_data)
        return await self.add_issuer(issuer_code, company_id)

    async def batch_add_stock_entries(self, entries):
        query = """
            INSERT INTO StockHistory (issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (issuer_id, date) DO NOTHING;
        """

        async with self.pool.acquire() as conn:
            await conn.executemany(query, entries)

    async def find_issuer_by_code(self, code):
        query = "SELECT id FROM Issuer WHERE code = $1"

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, code)

    async def find_stock_entry(self, code, date):
        issuer_id = await self.find_issuer_by_code(code)

        query = "SELECT * FROM StockHistory WHERE issuer_id = $1 AND date = $2"

        async with self.pool.acquire() as conn:
            result = await conn.fetchrow(query, issuer_id, date)
            return list(result)

    async def get_last_available_date(self, code):
        issuer_id = await self.find_issuer_by_code(code)

        query = "SELECT MAX(date) FROM StockHistory WHERE issuer_id = $1"

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_id)