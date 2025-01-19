from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List
from .database import Database

T = TypeVar('T')  # Type variable for items to analyze

class BaseAnalyzer(ABC, Generic[T]):
    def __init__(self, db_params: dict[str, str]) -> None:
        """Initialize analyzer with database parameters"""
        self.db = Database(**db_params)
        self.db_params = db_params
        
    async def execute_analysis(self) -> None:
        """Execute the analysis process"""
        await self.connect_db()
        items = await self.fetch_items()
        await self.process_data(items)
        await self.cleanup()    
    
    async def process_data(self, items: List[T]) -> None:
        """Process all items in sequence"""
        for item in items:
            await self.process_item(item)
        
    @abstractmethod
    async def connect_db(self) -> None:
        """Initialize database connection and create required tables"""
        pass
        
    @abstractmethod
    async def fetch_items(self) -> List[T]:
        """Retrieve list of items to be analyzed"""
        pass

    @abstractmethod
    async def process_item(self, item: T) -> None:
        """Process a single item"""
        pass
    
    async def cleanup(self) -> None:
        """Clean up resources after analysis."""
        await self.db.close()