from abc import ABC, abstractmethod
from typing import List, TypeVar, Generic
from .database import Database

T = TypeVar('T')  # Type variable for items
R = TypeVar('R')  # Type variable for processed results

class BaseScraper(ABC, Generic[T, R]):
    def __init__(self, db_params: dict[str, str]) -> None:
        """Initialize scraper with database parameters"""
        self.db = Database(**db_params)
        self.db_params = db_params
        
    async def execute_scraping(self) -> None:
        await self.connect_db()
        items = await self.fetch_items()
        await self.process_data(items)
        await self.cleanup()
    
    async def process_data(self, items: List[T]) -> None:
        for item in items:
            await self.process_item(item)
        
    @abstractmethod
    async def connect_db(self) -> None:
        """Connect to database and create necessary tables"""
        pass
        
    @abstractmethod
    async def fetch_items(self) -> List[T]:
        """Fetch list of items to process"""
        pass

    @abstractmethod
    async def fetch_last_available_date(self, item: T) -> R:
        """Get last available date for the item"""
        pass
    
    @abstractmethod
    async def fill_in_missing_data(self, last_date: R, item: T) -> None:
        """Fill in missing data for the item since last_date"""
        pass

    @abstractmethod
    async def process_item(self, item: T) -> None:
        """Process a single item"""
        pass

    async def cleanup(self) -> None:
        """Cleanup resources after scraping"""
        await self.db.close()