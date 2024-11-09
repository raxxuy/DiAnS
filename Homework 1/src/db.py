import asyncpg
from asyncpg.connection import Connection


class Database(object):
    def __init__(self, user, password, database, host="localhost"):
        self.conn: Connection | None = None
        self.user = user
        self.password = password
        self.database = database
        self.host = host

    async def connect(self):
        self.conn = await asyncpg.connect(
            database=self.database,
            host=self.host,
            user=self.user,
            password=self.password,
        )

    async def create_tables(self):
        if not self.conn:
            await self.connect()

        create_company_table = """
        CREATE TABLE IF NOT EXISTS Company (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(255),
            city VARCHAR(255),
            state VARCHAR(255),
            email VARCHAR(255),
            website VARCHAR(255),
            contact_person VARCHAR(255),
            phones VARCHAR(255)[],
            fax VARCHAR(255)[]
        );
        """

        create_issuer_table = """
        CREATE TABLE IF NOT EXISTS Issuer (
            id SERIAL PRIMARY KEY,
            code VARCHAR(20) UNIQUE NOT NULL,
            company_id INTEGER REFERENCES Company(id) ON DELETE CASCADE
        );
        """

        create_stock_history_table = """
        CREATE TABLE IF NOT EXISTS StockHistory (
            id SERIAL PRIMARY KEY,
            issuer_id INTEGER NOT NULL REFERENCES Issuer(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            last_trade_price DECIMAL(12, 2) NOT NULL,
            max_price DECIMAL(12, 2) NOT NULL,
            min_price DECIMAL(12, 2) NOT NULL,
            avg_price DECIMAL(12, 2) NOT NULL,
            percent_change DECIMAL(12, 2) NOT NULL,
            volume INTEGER NOT NULL,
            turnover_best INTEGER NOT NULL,
            total_turnover INTEGER NOT NULL,
            CONSTRAINT unique_stock_entry UNIQUE (issuer_id, date)
        );
        """

        await self.conn.execute(create_company_table)
        await self.conn.execute(create_issuer_table)
        await self.conn.execute(create_stock_history_table)

    async def add_company(self, name, address=None, city=None, state=None, email=None, website=None, contact_person=None, phones=None, fax=None):
        if not self.conn:
            await self.connect()

        query = """
        INSERT INTO Company (name, address, city, state, email, website, contact_person, phones, fax)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
        """

        company_id = await self.conn.fetchval(query, name, address, city, state, email, website, contact_person, phones, fax)
        return company_id

    async def add_issuer(self, code, company_id):
        if not self.conn:
            await self.connect()

        query = """
        INSERT INTO Issuer (code, company_id)
        VALUES ($1, $2)
        RETURNING id;
        """

        issuer_id = await self.conn.fetchval(query, code, company_id)
        return issuer_id

    async def add_stock_entry(self, issuer_id, date, last_trade_price, _max, _min, avg_price, percent_change, volume, turnover_best, total_turnover):
        if not self.conn:
            await self.connect()

        query = """
        INSERT INTO StockHistory (issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id;
        """

        stock_entry_id = await self.conn.fetchval(query, issuer_id, date, last_trade_price, _max, _min, avg_price, percent_change, volume, turnover_best, total_turnover)
        return stock_entry_id

    async def batch_add_stock_entries(self, entries):
        if not self.conn:
            await self.connect()

        query = """
        INSERT INTO StockHistory (issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (issuer_id, date) DO NOTHING;
        """

        await self.conn.executemany(query, entries)

    async def find_issuer_by_code(self, code):
        if not self.conn:
            await self.connect()

        query = "SELECT id FROM Issuer WHERE code = $1"
        result = await self.conn.fetchval(query, code)

        return result

    async def find_stock_entry(self, code, date):
        if not self.conn:
            await self.connect()

        issuer_id = await self.find_issuer_by_code(code)

        query = "SELECT * FROM StockHistory WHERE issuer_id = $1 AND date = $2"
        result = await self.conn.fetchrow(query, issuer_id, date)

        return list(result)

    async def get_last_available_date(self, code):
        if not self.conn:
            await self.connect()

        issuer_id = await self.find_issuer_by_code(code)

        query = "SELECT MAX(date) FROM StockHistory WHERE issuer_id = $1"
        result = await self.conn.fetchval(query, issuer_id)

        return result

    async def close(self):
        if self.conn:
            await self.conn.close()
            self.conn = None
