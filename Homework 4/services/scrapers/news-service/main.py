import inspect
import os
import sys
import utils
import asyncio
from dotenv import load_dotenv
from datetime import datetime
from aiohttp import ClientSession
from bs4 import BeautifulSoup, SoupStrainer

current_dir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

load_dotenv()

from shared.base_scraper import BaseScraper
from shared.decorators import MultiProcessScraper, LoggerScraper


class NewsScraper(BaseScraper):
    def __init__(self, db_params):
        super().__init__(db_params)
        
    async def connect_db(self):
        await self.db.connect()
        await self.db.create_news_table()

    async def fetch_items(self):
        links = []
        for i in range(1, 40):
            url = f"https://www.mse.mk/en/news/latest/{i}"

            async with ClientSession() as session:
                async with session.get(url) as response:
                    response_text = await response.text()
                    soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("div", {"id": "news-content"}))
                    
                    for link in soup.select("a"):
                        if link.select_one("b"):
                            links.append((link.get("href"), link.get("href").replace("en/", "mk/")))  

        return links

    async def fetch_last_available_date(self, item): # This filter is not needed for news
        pass
    
    async def fill_in_missing_data(self, last_date, item): # item is (news, news_mk) in this case
        news, news_mk = item
        
        if news is None or news_mk is None:
            return
        
        title, date, content = news
        title_mk, date_mk, content_mk = news_mk
        
        parsed_date = datetime.strptime(date, "%A, %B %d, %Y").date()
        parsed_date_mk = utils.parse_macedonian_date(date_mk)
        
        existing_news = await self.db.get_news(title, parsed_date, content)
        existing_news_mk = await self.db.get_news_mk(title_mk, parsed_date_mk, content_mk)
        
        if existing_news or existing_news_mk:
            return
        
        shared_id = await self.db.add_news(title, parsed_date, content, "en")
        await self.db.add_news_mk(shared_id, title_mk, parsed_date_mk, content_mk)
            
    async def process_item(self, item):
        link, link_mk = item
        news = await utils.fetch_news(link)
        news_mk = await utils.fetch_news(link_mk)
        await self.fill_in_missing_data(None, (news, news_mk))


if __name__ == "__main__":
    db_params = {
        "host": os.getenv("DB_HOST"),
        "database": os.getenv("DB_DATABASE"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD")
    }
    
    scraper = NewsScraper(db_params)
    scraper = MultiProcessScraper(scraper) # Add multi process at the beginning of the chain
    scraper = LoggerScraper(scraper) # Add logger at the end of the chain
    asyncio.run(scraper.execute_scraping())