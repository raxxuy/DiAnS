import os
import sys
import utils
import asyncio
import pandas as pd
from dotenv import load_dotenv

parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(parent_dir)

load_dotenv()

from shared.base_analyzer import BaseAnalyzer
from shared.decorators import LoggerAnalyzer, MultiProcessAnalyzer

class TechnicalAnalyzer(BaseAnalyzer):
    def __init__(self, db_params):
        super().__init__(db_params)

    async def connect_db(self):
        await self.db.connect()
        await self.db.create_technical_analysis_table()
        
    async def fetch_items(self):
        issuer_stocks = {}
        stocks = await self.db.get_stocks()
        
        for stock in stocks:
            if stock["issuer_id"] not in issuer_stocks:
                issuer_stocks[stock["issuer_id"]] = []
            issuer_stocks[stock["issuer_id"]].append(stock["id"]) 
            
        return issuer_stocks.items()
    
    async def process_item(self, item):
        issuer_id, stock_ids = item
        
        stocks_data = []
        for stock_id in stock_ids:
            records = await self.db.get_stock_history(stock_id)
            # Convert Record objects to dictionaries
            stocks_data.extend([{
                'date': record['date'],
                'max_price': float(record['max_price'].replace('.', '').replace(',', '.')),
                'min_price': float(record['min_price'].replace('.', '').replace(',', '.')),
                'avg_price': float(record['avg_price'].replace('.', '').replace(',', '.')),
                'volume': float(record['volume'])
            } for record in records])
        
        if len(stocks_data) < 14:
            print(f"Not enough data found for issuer {issuer_id}")
            return
        
        df = pd.DataFrame(stocks_data)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        results = utils.calculate_indicators(df)
        await self.db.store_technical_analysis(issuer_id, results['moving_averages'], results['oscillators'])
        print(f"Successfully processed issuer {issuer_id}")
    
if __name__ == "__main__":
    db_params = {
        "host": os.getenv("DB_HOST", "localhost"),
        "database": os.getenv("DB_DATABASE", "postgres"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres")
    }
    
    technical_analyzer = TechnicalAnalyzer(db_params)
    technical_analyzer = MultiProcessAnalyzer(technical_analyzer)
    technical_analyzer = LoggerAnalyzer(technical_analyzer)
    asyncio.run(technical_analyzer.execute_analysis())
