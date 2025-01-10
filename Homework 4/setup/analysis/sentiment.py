from textblob import TextBlob
import asyncio
from db import Database

class SentimentAnalyzer:
    def __init__(self, db: Database):
        self.db = db

    def analyze_text(self, text):
        if not text:
            return 0.0
        
        blob = TextBlob(text)

        return blob.sentiment.polarity

    async def process_news(self):
        news_items = await self.db.get_unprocessed_news()

        for news in news_items:
            text = news["content"] + "\n" + "\n".join(news["attachments"]) 
            sentiment_score = self.analyze_text(text)
            await self.db.add_news_sentiment(news["issuer_id"], news["id"], sentiment_score)
            print(f"Processed news {news['id']} with sentiment: {sentiment_score}")

async def main():
    db_params = {"user": "postgres", "password": "postgres", "database": "DB"}
    db = Database(**db_params)

    await db.connect()
    await db.create_tables()

    analyzer = SentimentAnalyzer(db)
    await analyzer.process_news()

    await db.close()

if __name__ == "__main__":
    asyncio.run(main())
