import os
import sys
import utils
import asyncio
from dotenv import load_dotenv
from aiohttp import ClientSession
from bs4 import BeautifulSoup, SoupStrainer

parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(parent_dir)

load_dotenv()

from shared.base_scraper import BaseScraper
from shared.decorators import MultiProcessScraper, LoggerScraper


class IssuerNewsScraper(BaseScraper):
    def __init__(self, db_params):
        super().__init__(db_params)
        
    async def connect_db(self):
        await self.db.connect()
        await self.db.create_issuer_news_table()

    async def fetch_items(self):
        issuers = await self.db.get_issuers()

        issuers_map = {}

        for issuer_code, db_id in issuers:
            url = f"https://www.mse.mk/en/symbol/{issuer_code}"

            async with ClientSession() as session:
                async with session.get(url) as response:
                    response_text = await response.text()
                    soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("div"))

                    link = soup.select_one("a[href^='https://seinet.com.mk/search/']")

                    if link is None:
                        continue
                
                    issuer_id = int(link.get("href").split("/")[-1])

                    issuers_map[issuer_code] = [issuer_id, db_id]

        return issuers_map.values()

    async def fetch_last_available_date(self, item): # item is (issuer_id, db_id) in this case
        issuer_id, db_id = item
        return await self.db.get_last_available_issuer_news_date(issuer_id)
    
    async def fill_in_missing_data(self, last_date, item):
        issuer_id, db_id = item
        news_ids = await utils.fetch_news(issuer_id, last_date)

        for news_id in news_ids:
            if await self.db.get_issuer_news_id(int(news_id)):
                continue

            if result := await utils.fetch_article(news_id):
                seinet_id, content, date, attachments = result
                await self.db.add_issuer_news(db_id, seinet_id, content, date, attachments) 
                
    async def process_item(self, item):
        last_date = await self.fetch_last_available_date(item)
        await self.fill_in_missing_data(last_date, item)


if __name__ == "__main__":
    db_params = {
        "host": os.getenv("DB_HOST", "localhost"),
        "database": os.getenv("DB_DATABASE", "postgres"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres")
    }
    
    scraper = IssuerNewsScraper(db_params)
    scraper = MultiProcessScraper(scraper) # Add multi process at the beginning of the chain
    scraper = LoggerScraper(scraper) # Add logger at the end of the chain
    asyncio.run(scraper.execute_scraping())