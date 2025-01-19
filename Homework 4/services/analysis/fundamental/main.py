import os
import sys
import utils
import asyncio
from typing import List, Dict
from dotenv import load_dotenv
from asyncpg import Record

parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(parent_dir)

load_dotenv()

from shared.base_analyzer import BaseAnalyzer
from shared.decorators import LoggerAnalyzer

# Type aliases
NewsItem = Record  # Database record containing news content and metadata


class FundamentalAnalyzer(BaseAnalyzer[NewsItem]):
    """Analyzer for performing sentiment analysis on news articles.
    
    This analyzer processes unprocessed news articles from the database,
    calculates sentiment scores using natural language processing,
    and stores the results for further analysis.
    """
    
    def __init__(self, db_params: Dict[str, str]) -> None:
        """Initialize the fundamental analyzer"""
        super().__init__(db_params)

    async def connect_db(self) -> None:
        """Connect to database and create required tables"""
        await self.db.connect()
        await self.db.create_news_sentiment_table()
        
    async def fetch_items(self) -> List[NewsItem]:
        """Fetch unprocessed news articles from database"""
        return await self.db.get_unprocessed_news()
    
    async def process_item(self, item: NewsItem) -> None:
        """Process a single news article to calculate sentiment"""
        try:
            # Combine main content with attachment text
            text = item["content"] + "\n" + "\n".join(item["attachments"]) 
            
            # Calculate sentiment score
            sentiment_score = utils.analyze_text(text)
            
            # Store results
            await self.db.add_news_sentiment(
                item["issuer_id"],
                item["id"],
                sentiment_score
            )
            
            print(f"Processed news {item['id']} with sentiment: {sentiment_score:.2f}")
            
        except Exception as e:
            print(f"Error processing news {item['id']}: {str(e)}")


if __name__ == "__main__":
    db_params = {
        "host": os.getenv("DB_HOST", "localhost"),
        "database": os.getenv("DB_DATABASE", "postgres"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres")
    }
    
    analyzer = FundamentalAnalyzer(db_params)
    analyzer = LoggerAnalyzer(analyzer)
    asyncio.run(analyzer.execute_analysis())