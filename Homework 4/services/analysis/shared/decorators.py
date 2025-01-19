import os
import time
import asyncio
from typing import Generic, List, Type
from datetime import datetime
from multiprocessing import Pool
from .base_analyzer import BaseAnalyzer, T
from .database import Database

class AnalyzerDecorator(BaseAnalyzer[T], Generic[T]):
    """Base decorator for adding behavior to analyzers"""
    
    def __init__(self, analyzer: BaseAnalyzer[T]) -> None:
        self._analyzer = analyzer
        self.db = analyzer.db
        self.db_params = analyzer.db_params
        self.is_decorated = isinstance(analyzer, AnalyzerDecorator)
        self.original_class = analyzer.__class__ if not self.is_decorated else analyzer.original_class

    async def connect_db(self) -> None:
        return await self._analyzer.connect_db()
    
    async def fetch_items(self) -> List[T]:
        return await self._analyzer.fetch_items()
    
    async def process_data(self, items: List[T]) -> None:
        return await self._analyzer.process_data(items)
    
    async def process_item(self, item: T) -> None:
        return await self._analyzer.process_item(item)
    
    async def execute_analysis(self) -> None:
        return await self._analyzer.execute_analysis()
    
    
class MultiProcessAnalyzer(AnalyzerDecorator[T]):
    """Decorator that adds multiprocessing capability to analyzers."""
    
    def __init__(self, analyzer: BaseAnalyzer[T], process_count: int = os.cpu_count() or 1) -> None:
        super().__init__(analyzer)
        self.process_count = process_count
        
    async def execute_analysis(self) -> None:
        await self.connect_db()
        items = await self.fetch_items()
        await self.process_data(items)
        await self.cleanup()
        
    async def process_data(self, items: List[T]) -> None:
        """Process items in parallel using multiple processes"""
        with Pool(processes=self.process_count) as pool:
            pool.starmap(process_item_worker, 
                        [(self.original_class, item, self.db_params) for item in items])
    

class LoggerAnalyzer(AnalyzerDecorator[T]):
    """Decorator that adds logging capability to analyzers."""
    
    def __init__(self, analyzer: BaseAnalyzer[T]) -> None:
        super().__init__(analyzer)
        
    async def execute_analysis(self) -> None:
        start_time = time.time()
        print(f"Starting analysis at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            await self._analyzer.execute_analysis()
        finally:
            end_time = time.time()
            duration = end_time - start_time
            print(f"Completed analysis at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Total execution time: {duration:.2f} seconds")
            

def process_item_worker(analyzer_class: Type[BaseAnalyzer[T]], item: T, db_params: dict[str, str]) -> None:
    """Worker function to process a single item"""
    async def process() -> None:
        db = Database(**db_params)
        await db.connect()
            
        try:
            analyzer = analyzer_class(db_params)
            analyzer.db = db
            await analyzer.process_item(item)
        finally:
            await db.close()

    asyncio.run(process())
