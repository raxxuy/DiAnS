import os
import sys
import utils
import asyncio
from dotenv import load_dotenv

parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(parent_dir)

load_dotenv()

from shared.base_analyzer import BaseAnalyzer
from shared.decorators import LoggerAnalyzer

class FundamentalAnalyzer(BaseAnalyzer):
    def __init__(self, db_params):
        super().__init__(db_params)

    async def connect_db(self):
        await self.db.connect()
        await self.db.create_news_sentiment_table()
        
    async def fetch_items(self):
        return await self.db.get_unprocessed_news()
    
    async def process_item(self, item):
        text = item["content"] + "\n" + "\n".join(item["attachments"]) 
        sentiment_score = utils.analyze_text(text)
        await self.db.add_news_sentiment(item["issuer_id"], item["id"], sentiment_score)
        print(f"Processed news {item['id']} with sentiment: {sentiment_score}")
        
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