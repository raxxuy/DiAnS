import inspect
import os
import sys
import utils
import asyncio
from dotenv import load_dotenv
from aiohttp import ClientSession
from datetime import datetime, timedelta
from bs4 import BeautifulSoup, SoupStrainer

current_dir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

load_dotenv()

from shared.base_scraper import BaseScraper
from shared.decorators import MultiProcessScraper, LoggerScraper


class IssuerScraper(BaseScraper):
    def __init__(self, db_params):
        super().__init__(db_params)
        
    async def connect_db(self):
        await self.db.connect()
        await self.db.create_issuer_tables()

    async def fetch_items(self):
        url = "https://www.mse.mk/en/stats/current-schedule"
        excluded = ['CKB', 'SNBTO', 'TTK'] # Excluded bonds
        issuers = []

        async with ClientSession() as session:
            async with session.get(url) as response:
                response_text = await response.text()
                soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("tbody"))

                for row in soup.select("tr"):
                    code = row.select("td")[0].text.strip()
                    if code not in excluded and not any(char.isdigit() for char in code):
                        issuers.append(code)

                return issuers

    async def fetch_last_available_date(self, item):
        return await self.db.get_last_available_issuer_date(item)

    async def fill_in_missing_data(self, last_date, item):
        if not last_date:
            last_date = (datetime.now() - timedelta(days=3650)).date()
        
        found = await self.db.find_issuer_by_code(item)
        stock_history = await utils.fetch_stock_history(item, last_date)
        
        if stock_history:
            if found is None:
                company_data = await utils.fetch_company(item, "en")
                company_data_mk = await utils.fetch_company(item, "mk")
                found = await self.db.assign_issuer(item, company_data)
                await self.db.assign_issuer_mk(found, company_data_mk)
        
            entries = [
                [found, datetime.strptime(stock_entry[0].replace(".", "/"), "%d/%m/%Y").date()] + stock_entry[1:]
                for stock_entry in stock_history
            ]
        
            await self.db.batch_add_stock_entries(entries)


async def main():
    try:
        db_params = {
            "host": os.getenv("DB_HOST", "postgres"),
            "database": os.getenv("DB_NAME", "DB"),
            "user": os.getenv("DB_USER", "postgres"),
            "password": os.getenv("DB_PASSWORD", "postgres")
        }
        
        scraper = IssuerScraper(db_params)
        scraper = MultiProcessScraper(scraper)
        scraper = LoggerScraper(scraper)
        await scraper.execute_scraping()
        
    except Exception as e:
        print(f"Error during scraping: {e}")
        # Remove completion flag if exists
        if os.path.exists("/app/scraping_complete"):
            os.remove("/app/scraping_complete")
        raise e

if __name__ == "__main__":
    asyncio.run(main())