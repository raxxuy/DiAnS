from abc import ABC, abstractmethod
from .database import Database

class BaseScraper(ABC):
    def __init__(self, db_params):
        self.db = Database(**db_params)
        self.db_params = db_params
        
    async def execute_scraping(self):
        await self.connect_db()
        items = await self.fetch_items() # Call to filter 1
        await self.process_data(items)
        await self.cleanup()
        
    @abstractmethod
    async def connect_db(self):
        pass
        
    @abstractmethod
    async def fetch_items(self): # Filter 1
        pass

    @abstractmethod
    async def fetch_last_available_date(self, item): # Filter 2
        pass
    
    @abstractmethod
    async def fill_in_missing_data(self, last_date, item): # Filter 3
        pass
    
    async def process_data(self, items):
        for item in items:
            await self.process_item(item)

    async def process_item(self, item):
        last_date = await self.fetch_last_available_date(item) # Call to filter 2
        await self.fill_in_missing_data(last_date, item) # Call to filter 3

    async def cleanup(self):
        await self.db.close()