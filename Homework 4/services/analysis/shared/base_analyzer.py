from abc import ABC, abstractmethod
from .database import Database

class BaseAnalyzer(ABC):
    def __init__(self, db_params):
        self.db = Database(**db_params)
        self.db_params = db_params
        
    async def execute_analysis(self):
        await self.connect_db()
        items = await self.fetch_items()
        await self.process_data(items)
        await self.cleanup()    
    
    async def process_data(self, items):
        for item in items:
            await self.process_item(item)
        
    @abstractmethod
    async def connect_db(self):
        pass
        
    @abstractmethod
    async def fetch_items(self):
        pass

    @abstractmethod
    async def process_item(self, item):
        pass
    
    async def cleanup(self):
        await self.db.close()