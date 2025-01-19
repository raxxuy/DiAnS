import os
import sys
import utils
import asyncio
from typing import List
from dotenv import load_dotenv
from aiohttp import ClientSession
from datetime import datetime, timedelta, date
from bs4 import BeautifulSoup, SoupStrainer

parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(parent_dir)

load_dotenv()

from shared.base_scraper import BaseScraper
from shared.decorators import MultiProcessScraper, LoggerScraper

# Type aliases
IssuerCode = str
StockHistory = List[List[str]]  # [date, last_trade_price, max_price, min_price, avg_price, percent_change, volume, turnover_best, total_turnover]
CompanyData = List[str]  # [code, name, address, city, state, email, website, contact_person, phones, fax]


class IssuerScraper(BaseScraper[IssuerCode, date]):
    def __init__(self, db_params: dict[str, str]) -> None:
        super().__init__(db_params)
        
    async def connect_db(self) -> None:
        await self.db.connect()
        await self.db.create_issuer_tables()

    async def fetch_items(self) -> List[IssuerCode]:
        url = "https://www.mse.mk/en/stats/current-schedule"
        excluded = ['CKB', 'SNBTO', 'TTK']  # Excluded bonds
        issuers: List[IssuerCode] = []

        async with ClientSession() as session:
            async with session.get(url) as response:
                response_text = await response.text()
                soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("tbody"))

                for row in soup.select("tr"):
                    code = row.select("td")[0].text.strip()
                    if code not in excluded and not any(char.isdigit() for char in code):
                        issuers.append(code)

                return issuers

    async def fetch_last_available_date(self, item: IssuerCode) -> date:
        last_date = await self.db.get_last_available_issuer_date(item)
        return last_date or (datetime.now() - timedelta(days=3650)).date()

    async def fill_in_missing_data(self, last_date: date, item: IssuerCode) -> None:
        stock_history = await utils.fetch_stock_history(item, last_date)
        
        if not stock_history:
            return
            
        found = await self.db.find_issuer_by_code(item)
        
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
            
    async def process_item(self, item: IssuerCode) -> None:
        last_date = await self.fetch_last_available_date(item)
        await self.fill_in_missing_data(last_date, item)


if __name__ == "__main__":
    db_params = {
        "host": os.getenv("DB_HOST", "localhost"),
        "database": os.getenv("DB_DATABASE", "postgres"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres")
    }
    
    scraper = IssuerScraper(db_params)
    scraper = MultiProcessScraper(scraper)
    scraper = LoggerScraper(scraper)
    asyncio.run(scraper.execute_scraping())