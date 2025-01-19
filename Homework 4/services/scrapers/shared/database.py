from datetime import date
from typing import List, Tuple, Optional, Any
from asyncpg import create_pool, Pool

# Type aliases
StockEntry = Tuple[int, date, str, str, str, str, str, str, str, str]  # (issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)
CompanyData = Tuple[str, str, Optional[str], Optional[str], Optional[str], Optional[str], Optional[str], Optional[str], Optional[List[str]], Optional[List[str]]]  # (code, name, address, city, state, email, website, contact_person, phones, fax)


class Database:
    """Database interface for scrapers"""
    def __init__(self, user: str, password: str, database: str, host: str) -> None:
        self.pool: Optional[Pool] = None
        self.user = user
        self.password = password
        self.database = database
        self.host = host

    async def connect(self) -> None:
        """Create connection pool to database"""
        self.pool = await create_pool(
            user=self.user,
            password=self.password,
            database=self.database,
            host=self.host,
            min_size=1,
            max_size=30
        )

    async def close(self) -> None:
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            
    async def create_issuer_tables(self) -> None:
        """Create tables for issuer data if they don't exist"""
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
        
    async def create_news_table(self) -> None:
        """Create table for news data if it doesn't exist"""
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
                
    async def create_issuer_news_table(self) -> None:
        """Create table for issuer news if it doesn't exist"""
        query = """
            CREATE TABLE IF NOT EXISTS issuer_news (
                id SERIAL PRIMARY KEY,
                seinet_id INT NOT NULL,
                issuer_id INT NOT NULL,
                content TEXT,
                date DATE NOT NULL,
                attachments TEXT[],
                FOREIGN KEY (issuer_id) REFERENCES issuer(id),
                UNIQUE(issuer_id, seinet_id)
            );
        """

        async with self.pool.acquire() as conn:
            await conn.execute(query)

    async def add_company(self, code: str, name: str, address: Optional[str] = None, 
                         city: Optional[str] = None, state: Optional[str] = None, 
                         email: Optional[str] = None, website: Optional[str] = None, 
                         contact_person: Optional[str] = None, phones: Optional[List[str]] = None, 
                         fax: Optional[List[str]] = None) -> int:
        """Add a company to the database"""
        query = """
            INSERT INTO Company (code, name, address, city, state, email, website, contact_person, phones, fax)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, code, name, address, city, state, email, website, contact_person, phones, fax)
        
    async def add_company_mk(self, code: str, name: str, address: Optional[str] = None, 
                            city: Optional[str] = None, state: Optional[str] = None, 
                            email: Optional[str] = None, website: Optional[str] = None, 
                            contact_person: Optional[str] = None, phones: Optional[List[str]] = None, 
                            fax: Optional[List[str]] = None) -> int:
        """Add a Macedonian company to the database"""
        query = """
            INSERT INTO Company_mk (code, name, address, city, state, email, website, contact_person, phones, fax)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, code, name, address, city, state, email, website, contact_person, phones, fax)

    async def add_issuer(self, code: str, company_id: int) -> int:
        """Add an issuer to the database"""
        query = """
            INSERT INTO Issuer (code, company_id)
            VALUES ($1, $2)
            RETURNING id;
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, code, company_id)
        
    async def update_issuer(self, issuer_id: int, company_mk_id: int) -> None:
        """Update issuer with Macedonian company ID"""
        query = """
            UPDATE Issuer SET company_mk_id = $2 WHERE id = $1;
        """

        async with self.pool.acquire() as conn:
            await conn.execute(query, issuer_id, company_mk_id)

    async def assign_issuer(self, issuer_code: str, company_data: CompanyData) -> int:
        """Create company and assign it to a new issuer"""
        company_id = await self.add_company(*company_data)
        return await self.add_issuer(issuer_code, company_id)
    
    async def assign_issuer_mk(self, issuer_id: int, company_data_mk: CompanyData) -> None:
        """Create Macedonian company and assign it to existing issuer"""
        company_mk_id = await self.add_company_mk(*company_data_mk)
        await self.update_issuer(issuer_id, company_mk_id)
    
    async def add_stock_entry(self, issuer_id: int, date: date, last_trade_price: str,
                            max_price: str, min_price: str, avg_price: str, percent_change: str,
                            volume: str, turnover_best: str, total_turnover: str) -> int:
        """Add a stock history entry"""
        query = """
            INSERT INTO StockHistory (issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)

    async def batch_add_stock_entries(self, entries: List[StockEntry]) -> None:
        """Add multiple stock history entries in batch"""
        query = """
            INSERT INTO StockHistory (issuer_id, date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (issuer_id, date) DO NOTHING;
        """

        async with self.pool.acquire() as conn:
            await conn.executemany(query, entries)
            
    async def get_issuers(self) -> List[Tuple[str, int]]:
        """Get list of all issuers with their codes and IDs"""
        query = """
            SELECT code, id FROM issuer
        """

        async with self.pool.acquire() as conn:
            return await conn.fetch(query)

    async def find_issuer_by_code(self, code: str) -> Optional[int]:
        """Find issuer ID by code"""
        query = "SELECT id FROM Issuer WHERE code = $1"

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, code)

    async def get_last_available_issuer_date(self, code: str) -> Optional[date]:
        """Get most recent date in stock history for an issuer"""
        issuer_id = await self.find_issuer_by_code(code)
        if not issuer_id:
            return None

        query = "SELECT MAX(date) FROM StockHistory WHERE issuer_id = $1"

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_id)
        
    async def get_last_available_issuer_news_date(self, issuer_id: int) -> Optional[date]:
        """Get most recent date in news for an issuer"""
        query = """
            SELECT date FROM issuer_news WHERE issuer_id = $1 ORDER BY date DESC LIMIT 1
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, issuer_id)
        
    async def get_last_available_news_date(self) -> Optional[date]:
        """Get most recent date in general news"""
        query = "SELECT MAX(date) FROM News"

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query)
        
    async def add_news(self, title: str, date: date, content: List[str], locale: str) -> int:
        """Add news article"""
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

    async def add_news_mk(self, shared_id: int, title: str, date: date, content: List[str]) -> None:
        """Add Macedonian news article"""
        query = """
            INSERT INTO News (shared_id, title, date, content, locale)
            VALUES ($1, $2, $3, $4, 'mk')
            ON CONFLICT (shared_id, locale) DO NOTHING
        """

        async with self.pool.acquire() as conn:
            await conn.execute(query, shared_id, title, date, content)
            
    async def get_news(self, title: str, date: date, content: List[str]) -> List[Any]:
        """Get news article by content"""
        query = """
            SELECT * FROM News WHERE title = $1 AND date = $2 AND content = $3
        """

        async with self.pool.acquire() as conn:
            return await conn.fetch(query, title, date, content)

    async def get_news_mk(self, title: str, date: date, content: List[str]) -> List[Any]:
        """Get Macedonian news article by content"""
        query = """
            SELECT * FROM News WHERE title = $1 AND date = $2 AND content = $3 AND locale = 'mk'
        """

        async with self.pool.acquire() as conn:
            return await conn.fetch(query, title, date, content)

    async def add_issuer_news(self, issuer_id: int, seinet_id: int, content: str, date: date, attachments: List[str]) -> None:
        """Add issuer-specific news article"""
        query = """
            INSERT INTO issuer_news (issuer_id, seinet_id, content, date, attachments)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (issuer_id, seinet_id) DO NOTHING
        """

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(query, issuer_id, seinet_id, content, date, attachments)
        except Exception as e:
            print(content, date, attachments)
    
    async def get_issuer_news_id(self, seinet_id: int) -> Optional[int]:
        """Get issuer news ID by seinet ID"""
        query = """
            SELECT id FROM issuer_news WHERE seinet_id = $1
        """

        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, seinet_id)
