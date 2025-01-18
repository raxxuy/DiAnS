import os
import time
import asyncio
from multiprocessing import Pool
from .base_analyzer import BaseAnalyzer
from .database import Database

class AnalyzerDecorator(BaseAnalyzer):
    def __init__(self, analyzer: BaseAnalyzer):
        self._analyzer = analyzer
        self.db = analyzer.db
        self.db_params = analyzer.db_params
        self.is_decorated = isinstance(analyzer, AnalyzerDecorator)
        self.original_class = analyzer.__class__ if not self.is_decorated else analyzer.original_class

    async def connect_db(self):
        return await self._analyzer.connect_db()
    
    async def fetch_items(self):
        return await self._analyzer.fetch_items()
    
    async def process_data(self, items):
        return await self._analyzer.process_data(items)
    
    async def process_item(self, item):
        return await self._analyzer.process_item(item)
    
    async def execute_analysis(self):
        return await self._analyzer.execute_analysis()
    
    
class MultiProcessAnalyzer(AnalyzerDecorator):
    def __init__(self, analyzer: BaseAnalyzer, process_count: int = os.cpu_count()):
        super().__init__(analyzer)
        self.process_count = process_count
        
    async def execute_analysis(self):
        await self.connect_db()
        items = await self.fetch_items()
        await self.process_data(items)
        await self.cleanup()
        
    async def process_data(self, items):
        with Pool(processes=self.process_count) as pool:
            pool.starmap(process_item_worker, 
                        [(self.original_class, item, self.db_params) for item in items])
    

class LoggerAnalyzer(AnalyzerDecorator):
    def __init__(self, analyzer: BaseAnalyzer):
        super().__init__(analyzer)
        
    async def execute_analysis(self):
        start_time = time.time()
        print(f"Starting analysis at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            await self._analyzer.execute_analysis()
        finally:
            end_time = time.time()
            duration = end_time - start_time
            print(f"Completed analysis at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Total execution time: {duration:.2f} seconds")
            

def process_item_worker(analyzer_class, item, db_params):
    """Worker function that processes a single item in a separate process"""
    
    async def process():
        # Create a new database connection for this process
        db = Database(**db_params)
        await db.connect()
            
        try:
            # Create a new instance of the original analyzer class
            analyzer = analyzer_class(db_params)
            analyzer.db = db
            
            # Use process_item which might have optimizations in decorator classes
            await analyzer.process_item(item)
        finally:
            await db.close()

    # Run the async code in this process
    asyncio.run(process())
