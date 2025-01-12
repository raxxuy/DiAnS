import os
import time
import asyncio
from typing import List
from datetime import datetime
from multiprocessing import Pool
from .base_scraper import BaseScraper
from .database import Database

class ScraperDecorator(BaseScraper):
    def __init__(self, scraper: BaseScraper):
        self._scraper = scraper
        self.db = scraper.db
        self.db_params = scraper.db_params
        self.is_decorated = isinstance(scraper, ScraperDecorator)
        self.original_class = scraper.__class__ if not self.is_decorated else scraper.original_class

    async def connect_db(self):
        return await self._scraper.connect_db()
    
    async def fetch_items(self) -> List[str]:
        return await self._scraper.fetch_items()

    async def fetch_last_available_date(self, item) -> datetime:
        return await self._scraper.fetch_last_available_date(item)

    async def fill_in_missing_data(self, last_date, item):
        return await self._scraper.fill_in_missing_data(last_date, item)
    
    async def process_data(self, items):
        return await self._scraper.process_data(items)
    
    async def process_item(self, item):
        return await self._scraper.process_item(item)

    async def execute_scraping(self):
        return await self._scraper.execute_scraping()


class MultiProcessScraper(ScraperDecorator):
    def __init__(self, scraper: BaseScraper):
        super().__init__(scraper)
        
    async def execute_scraping(self):
        await self.connect_db()
        items = await self.fetch_items()
        await self.process_data(items)
        await self.cleanup()
        
    async def process_data(self, items):
        with Pool(processes=os.cpu_count()) as pool:
            # Pass the scraper class, item, and db_params to the worker
            pool.starmap(process_item_worker, 
                        [(self.original_class, item, self.db_params) for item in items])
            

class LoggerScraper(ScraperDecorator):
    def __init__(self, scraper: BaseScraper):
        super().__init__(scraper)
        
    async def execute_scraping(self):
        start_time = time.time()
        print(f"Starting scraping at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            await self._scraper.execute_scraping()
        finally:
            end_time = time.time()
            duration = end_time - start_time
            print(f"Completed scraping at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Total execution time: {duration:.2f} seconds")
            

def process_item_worker(scraper_class, item, db_params):
    """Worker function that processes a single item in a separate process"""
    
    async def process():
        # Create a new database connection for this process
        db = Database(**db_params)
        await db.connect()
            
        try:
            # Create a new instance of the original scraper class
            scraper = scraper_class(db_params)
            scraper.db = db
            
            # Use process_item which might have optimizations in decorator classes
            await scraper.process_item(item)
        finally:
            await db.close()

    # Run the async code in this process
    asyncio.run(process())