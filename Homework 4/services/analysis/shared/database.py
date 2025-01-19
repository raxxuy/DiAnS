from typing import Optional, List, Dict, Any, Sequence
from asyncpg import create_pool, Pool, Record
from datetime import timedelta, date
import json

# Type aliases
StockRecord = Record  # Stock history record from database
IssuerRecord = Record  # Issuer record from database
NewsRecord = Record  # News record from database
JsonDict = Dict[str, Any]  # JSON-serializable dictionary

class Database:
    """Database interface for market analysis operations"""
    
    def __init__(self, user: str, password: str, database: str, host: str) -> None:
        """Initialize database connection parameters."""
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
            max_size=15
        )

    async def close(self) -> None:
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None
    
    async def create_news_sentiment_table(self) -> None:
        """Create news sentiment table if it doesn't exist"""
        query = """
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
            
        async with self.pool.acquire() as conn:
            await conn.execute(query)
            
    async def create_technical_analysis_table(self) -> None:
        """Create or recreate technical analysis table"""
        drop_query = """
            DROP TABLE IF EXISTS technical_analysis CASCADE;
        """
        
        create_query = """
            CREATE TABLE technical_analysis (
                id SERIAL PRIMARY KEY,
                issuer_id INT NOT NULL UNIQUE,
                oscillators JSONB NOT NULL,
                moving_averages JSONB NOT NULL,
                created_at DATE NOT NULL DEFAULT NOW(),
                FOREIGN KEY (issuer_id) REFERENCES issuer(id)
            );
            
            -- Add index on issuer_id for faster lookups
            CREATE INDEX IF NOT EXISTS idx_technical_analysis_issuer 
            ON technical_analysis(issuer_id);
            
            -- Add index on created_at for time-based queries
            CREATE INDEX IF NOT EXISTS idx_technical_analysis_date 
            ON technical_analysis(created_at);
        """
        
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(drop_query)
                await conn.execute(create_query)
                
    async def create_lstm_predictions_table(self) -> None:
        """Create or recreate LSTM predictions table"""
        drop_query = """
            DROP TABLE IF EXISTS lstm_predictions CASCADE;
        """
        
        create_query = """
            CREATE TABLE lstm_predictions (
                id SERIAL PRIMARY KEY,
                issuer_id INT NOT NULL,
                prediction_date DATE NOT NULL,
                predicted_price FLOAT NOT NULL,
                FOREIGN KEY (issuer_id) REFERENCES issuer(id),
                CONSTRAINT unique_issuer_date UNIQUE (issuer_id, prediction_date)
            );
        """
        
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(drop_query)
                await conn.execute(create_query)
        
    async def get_unprocessed_news(self) -> List[NewsRecord]:
        """Get unprocessed news articles"""
        query = """
            SELECT i.id, i.content, i.attachments, i.issuer_id
            FROM issuer_news i
                LEFT JOIN news_sentiment ns ON i.id = ns.issuer_news_id
                WHERE ns.id IS NULL AND i.content IS NOT NULL
            """
            
        async with self.pool.acquire() as conn:
            return await conn.fetch(query)

    async def add_news_sentiment(self, issuer_id: int, issuer_news_id: int, sentiment: float) -> None:
        """Add sentiment analysis result for a news article"""
        query = """
            INSERT INTO news_sentiment (issuer_id, issuer_news_id, sentiment)
            VALUES ($1, $2, $3)
            ON CONFLICT (issuer_news_id) DO NOTHING
        """

        async with self.pool.acquire() as conn:
            await conn.execute(query, issuer_id, issuer_news_id, sentiment)

    async def get_stocks(self) -> List[StockRecord]:
        """Get stock records from the last year"""
        query = """
            SELECT id, issuer_id FROM stockhistory
            WHERE date >= CURRENT_DATE - INTERVAL '365 days'
            ORDER BY date DESC
        """

        async with self.pool.acquire() as conn:
            return await conn.fetch(query)

    async def get_stock_history(self, stock_id: int) -> List[StockRecord]:
        """Get historical data for a specific stock"""
        query = """
            SELECT date, max_price, min_price, avg_price, volume
            FROM stockhistory 
            WHERE id = $1
            ORDER BY date DESC
        """
        
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, stock_id)

    async def store_technical_analysis(self, issuer_id: int, 
                                     moving_averages: JsonDict,
                                     oscillators: JsonDict) -> int:
        """Store technical analysis results for an issuer"""
        delete_query = """
            DELETE FROM technical_analysis 
            WHERE issuer_id = $1 
            AND DATE(created_at) = CURRENT_DATE;
        """
        
        insert_query = """
            INSERT INTO technical_analysis (issuer_id, moving_averages, oscillators)
            VALUES ($1, $2, $3)
            RETURNING id;
        """
        
        moving_averages_json = json.dumps(moving_averages)
        oscillators_json = json.dumps(oscillators) 
        
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(delete_query, issuer_id)
                result = await conn.fetchrow(insert_query, issuer_id, moving_averages_json, oscillators_json)
                return result['id']
            
    async def save_lstm_predictions(self, issuer_id: int, predictions: Sequence[float], 
                                  start_date: date) -> None:
        """Save LSTM model predictions for an issuer"""
        query = """
            INSERT INTO lstm_predictions (issuer_id, prediction_date, predicted_price)
            VALUES ($1, $2, $3)
            ON CONFLICT ON CONSTRAINT unique_issuer_date
            DO UPDATE SET predicted_price = EXCLUDED.predicted_price
        """
        
        async with self.pool.acquire() as conn:
            for i, pred in enumerate(predictions):
                pred_date = start_date + timedelta(days=i)
                await conn.execute(query, issuer_id, pred_date, pred)
            
    async def get_issuers(self) -> List[IssuerRecord]:
        """Get all issuers"""
        query = """
            SELECT code, id FROM issuer
        """
        async with self.pool.acquire() as conn:
            return await conn.fetch(query)

    async def get_issuer_stocks(self, issuer_id: int) -> List[StockRecord]:
        """Get stock history for a specific issuer"""
        query = """
            SELECT avg_price, date FROM stockhistory
            WHERE issuer_id = $1
            AND date >= CURRENT_DATE - INTERVAL '365 days'
            ORDER BY date DESC
        """
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, issuer_id)
