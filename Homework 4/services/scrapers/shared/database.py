from asyncpg import create_pool, Pool


class Database:
    def __init__(self, user, password, database, host):
        self.pool: Pool | None = None
        self.user = user
        self.password = password
        self.database = database
        self.host = host

    async def connect(self):
        self.pool = await create_pool(
            user=self.user,
            password=self.password,
            database=self.database,
            host=self.host,
            min_size=1,
            max_size=30
        )

    async def close(self):
        if self.pool:
            await self.pool.close()
            self.pool = None
            
    async def create_issuer_tables(self):
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
            CREATE TABLE IF NOT EXISTS Company_mk (
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
                company_id INTEGER REFERENCES Company(id) ON DELETE CASCADE,
                company_mk_id INTEGER REFERENCES Company_mk(id) ON DELETE CASCADE
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
        
    async def create_news_table(self):
        queries = [
            """
            CREATE SEQUENCE IF NOT EXISTS news_shared_id_seq;
            """,
            """
            CREATE TABLE IF NOT EXISTS News (
                id SERIAL PRIMARY KEY,
                shared_id INTEGER NOT NULL DEFAULT nextval('news_shared_id_seq'),
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
                
    async def create_issuer_news_table(self):
        query = """
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

        async with self.pool.acquire() as conn:
            await conn.execute(query)

    async def add_company(self, code, name, address=None, city=None, state=None, email=None, website=None, contact_person=None, phones=None, fax=None):
        query = """
            INSERT INTO Company (code, name, address, city, state, email, website, contact_person, phones, fax)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, code, name, address, city, state, email, website, contact_person, phones, fax)
        
    async def add_company_mk(self, code, name, address=None, city=None, state=None, email=None, website=None, contact_person=None, phones=None, fax=None):
        query = """
            INSERT INTO Company_mk (code, name, address, city, state, email, website, contact_person, phones, fax)
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
        
    async def update_issuer(self, issuer_id, company_mk_id):
        query = """
            UPDATE Issuer SET company_mk_id = $2 WHERE id = $1;
        """

        async with self.pool.acquire() as conn:
            await conn.execute(query, issuer_id, company_mk_id)

    async def assign_issuer(self, issuer_code, company_data):
        company_id = await self.add_company(*company_data)
        return await self.add_issuer(issuer_code, company_id)
    
    async def assign_issuer_mk(self, issuer_code, company_data_mk):
        company_mk_id = await self.add_company_mk(*company_data_mk)
        return await self.update_issuer(issuer_code, company_mk_id)
    
    async def add_stock_entry(self, issuer_id, date, last_trade_price, _max, _min, avg_price, percent_change, volume, turnover_best, total_turnover):
        query = """
            INSERT INTO StockHistory (issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_id, date, last_trade_price, _max, _min, avg_price, percent_change, volume, turnover_best, total_turnover)

    async def batch_add_stock_entries(self, entries):
        query = """
            INSERT INTO StockHistory (issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (issuer_id, date) DO NOTHING;
        """

        async with self.pool.acquire() as conn:
            await conn.executemany(query, entries)
            
    async def get_issuers(self):
        query = """
            SELECT code, id FROM issuer
        """

        async with self.pool.acquire() as conn:
            return await conn.fetch(query)

    async def find_issuer_by_code(self, code):
        query = "SELECT id FROM Issuer WHERE code = $1"

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, code)

    async def get_last_available_issuer_date(self, code):
        issuer_id = await self.find_issuer_by_code(code)

        query = "SELECT MAX(date) FROM StockHistory WHERE issuer_id = $1"

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_id)
        
    async def get_last_available_issuer_news_date(self, issuer_id):
        query = """
            SELECT date FROM issuer_news WHERE issuer_id = $1 ORDER BY date DESC LIMIT 1
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_id)
        
    async def get_last_available_news_date(self):
        query = "SELECT MAX(date) FROM News"

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query)
        
    async def add_news(self, title, date, content, locale):
        query = """
            INSERT INTO News (title, date, content, locale)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (shared_id, locale) DO UPDATE SET
                date = EXCLUDED.date,
                content = EXCLUDED.content
            RETURNING shared_id
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


    async def get_news_mk(self, title, date, content):
        query = """
            SELECT * FROM News WHERE title = $1 AND date = $2 AND content = $3 AND locale = 'mk'
        """

        async with self.pool.acquire() as conn:
            return await conn.fetch(query, title, date, content)

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
    
    async def get_issuer_news_id(self, seinet_id):
        query = """
            SELECT id FROM issuer_news WHERE seinet_id = $1
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, seinet_id)
