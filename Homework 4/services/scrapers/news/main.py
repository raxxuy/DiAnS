import os
import sys
import utils
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from typing import List, Tuple, Optional
from aiohttp import ClientSession
from bs4 import BeautifulSoup, SoupStrainer

parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(parent_dir)

load_dotenv()

from shared.base_scraper import BaseScraper
from shared.decorators import MultiProcessScraper, LoggerScraper

# Type aliases
NewsItem = Tuple[str, str]  # (en_link, mk_link)
NewsContent = Optional[Tuple[str, str, List[str]]]  # (title, date, content) or None
ProcessedNews = Tuple[NewsContent, NewsContent]  # (en_news, mk_news)


class NewsScraper(BaseScraper[NewsItem, None]):
    def __init__(self, db_params: dict[str, str]) -> None:
        super().__init__(db_params)
        
    async def connect_db(self) -> None:
        await self.db.connect()
        await self.db.create_news_table()

    async def fetch_items(self) -> List[NewsItem]:
        links: List[NewsItem] = []
        
        for i in range(1, 40):
            url = f"https://www.mse.mk/en/news/latest/{i}"

            async with ClientSession() as session:
                async with session.get(url) as response:
                    response_text = await response.text()
                    soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("div", {"id": "news-content"}))
                    
                    for link in soup.select("a"):
                        if link.select_one("b"):
                            en_link = link.get("href")
                            mk_link = en_link.replace("en/", "mk/")
                            links.append((en_link, mk_link))
                            
        return links

    async def fetch_last_available_date(self, item: NewsItem) -> None:
        # This filter is not needed for news
        return None
    
    async def fill_in_missing_data(self, last_date: None, item: NewsItem) -> None:
        news_en, news_mk = await self.process_news_item(item)
        
        if not news_en or not news_mk:
            return
        
        title_en, date_en, content_en = news_en
        title_mk, date_mk, content_mk = news_mk
        
        parsed_date_en = datetime.strptime(date_en, "%A, %B %d, %Y").date()
        parsed_date_mk = utils.parse_macedonian_date(date_mk)
        
        existing_news_en = await self.db.get_news(title_en, parsed_date_en, content_en)
        existing_news_mk = await self.db.get_news_mk(title_mk, parsed_date_mk, content_mk)
        
        if existing_news_en or existing_news_mk:
            return
        
        shared_id = await self.db.add_news(title_en, parsed_date_en, content_en, "en")
        await self.db.add_news_mk(shared_id, title_mk, parsed_date_mk, content_mk)
            
    async def process_item(self, item: NewsItem) -> None:
        await self.fill_in_missing_data(None, item)
        
    async def process_news_item(self, item: NewsItem) -> ProcessedNews:
        link_en, link_mk = item
        news_en = await utils.fetch_news(link_en)
        news_mk = await utils.fetch_news(link_mk)
        return news_en, news_mk


if __name__ == "__main__":
    db_params = {
        "host": os.getenv("DB_HOST", "localhost"),
        "database": os.getenv("DB_DATABASE", "postgres"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres")
    }
    
    scraper = NewsScraper(db_params)
    scraper = MultiProcessScraper(scraper)
    scraper = LoggerScraper(scraper)
    asyncio.run(scraper.execute_scraping())