import os
import time
import asyncio
from typing import List, Type
from multiprocessing import Pool
from .base_scraper import BaseScraper, T, R
from .database import Database


class ScraperDecorator(BaseScraper[T, R]):
    """Base decorator for adding behavior to scrapers"""
    def __init__(self, scraper: BaseScraper[T, R]) -> None:
        self._scraper = scraper
        self.db = scraper.db
        self.db_params = scraper.db_params
        self.is_decorated = isinstance(scraper, ScraperDecorator)
        self.original_class = scraper.__class__ if not self.is_decorated else scraper.original_class

    async def connect_db(self) -> None:
        return await self._scraper.connect_db()
    
    async def fetch_items(self) -> List[T]:
        return await self._scraper.fetch_items()

    async def fetch_last_available_date(self, item: T) -> R:
        return await self._scraper.fetch_last_available_date(item)

    async def fill_in_missing_data(self, last_date: R, item: T) -> None:
        return await self._scraper.fill_in_missing_data(last_date, item)
    
    async def process_data(self, items: List[T]) -> None:
        return await self._scraper.process_data(items)
    
    async def process_item(self, item: T) -> None:
        return await self._scraper.process_item(item)

    async def execute_scraping(self) -> None:
        return await self._scraper.execute_scraping()


class MultiProcessScraper(ScraperDecorator[T, R]):
    """Decorator that adds multiprocessing capability to scrapers"""
    def __init__(self, scraper: BaseScraper[T, R], process_count: int = os.cpu_count() or 1) -> None:
        super().__init__(scraper)
        self.process_count = process_count
        
    async def execute_scraping(self) -> None:
        await self.connect_db()
        items = await self.fetch_items()
        await self.process_data(items)
        await self.cleanup()
        
    async def process_data(self, items: List[T]) -> None:
        """Process items in parallel using multiple processes"""
        with Pool(processes=self.process_count) as pool:
            pool.starmap(process_item_worker, [(self.original_class, item, self.db_params) for item in items])
            

class LoggerScraper(ScraperDecorator[T, R]):
    """Decorator that adds logging capability to scrapers"""
    def __init__(self, scraper: BaseScraper[T, R]) -> None:
        super().__init__(scraper)
        
    async def execute_scraping(self) -> None:
        start_time = time.time()
        print(f"Starting scraping at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            await self._scraper.execute_scraping()
        finally:
            end_time = time.time()
            duration = end_time - start_time
            print(f"Completed scraping at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Total execution time: {duration:.2f} seconds")
            

def process_item_worker(scraper_class: Type[BaseScraper[T, R]], item: T, db_params: dict[str, str]) -> None:
    """Worker function to process a single item"""
    async def process() -> None:
        db = Database(**db_params)
        await db.connect()
            
        try:
            scraper = scraper_class(db_params)
            scraper.db = db
            await scraper.process_item(item)
        finally:
            await db.close()

    asyncio.run(process())