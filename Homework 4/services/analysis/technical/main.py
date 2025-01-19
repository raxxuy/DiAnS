import os
import sys
import utils
import asyncio
import pandas as pd
from typing import List, Dict, Tuple, Any
from dotenv import load_dotenv

parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(parent_dir)

load_dotenv()

from shared.base_analyzer import BaseAnalyzer
from shared.decorators import LoggerAnalyzer, MultiProcessAnalyzer

# Type aliases
IssuerStocks = Tuple[int, List[int]]  # (issuer_id, list of stock_ids)
StockData = Dict[str, Any]  # Stock history record
IndicatorResults = Dict[str, Dict[str, Any]]  # Technical indicator results


class TechnicalAnalyzer(BaseAnalyzer[IssuerStocks]):
    """Analyzer for calculating technical indicators from stock data.
    
    This analyzer calculates various technical indicators including:
    - Moving averages (SMA, EMA, WMA, WEMA, DEMA)
    - Oscillators (RSI, MACD, Stochastic, CCI, Williams %R)
    """
    
    def __init__(self, db_params: dict[str, str]) -> None:
        """Initialize the technical analyzer"""
        super().__init__(db_params)

    async def connect_db(self) -> None:
        """Connect to database and create technical analysis table"""
        await self.db.connect()
        await self.db.create_technical_analysis_table()
        
    async def fetch_items(self) -> List[IssuerStocks]:
        """Fetch stock history grouped by issuer"""
        issuer_stocks: Dict[int, List[int]] = {}
        stocks = await self.db.get_stocks()
        
        for stock in stocks:
            issuer_id = stock["issuer_id"]
            if issuer_id not in issuer_stocks:
                issuer_stocks[issuer_id] = []
            issuer_stocks[issuer_id].append(stock["id"])
            
        return list(issuer_stocks.items())
    
    async def process_item(self, item: IssuerStocks) -> None:
        """Process technical analysis for a single issuer"""
        issuer_id, stock_ids = item
        
        # Collect stock data
        stocks_data: List[StockData] = []
        for stock_id in stock_ids:
            records = await self.db.get_stock_history(stock_id)
            stocks_data.extend([{
                'date': record['date'],
                'max_price': float(record['max_price'].replace('.', '').replace(',', '.')),
                'min_price': float(record['min_price'].replace('.', '').replace(',', '.')),
                'avg_price': float(record['avg_price'].replace('.', '').replace(',', '.')),
                'volume': float(record['volume'])
            } for record in records])
        
        # Check if we have enough data
        if len(stocks_data) < 14:  # Minimum required for most indicators
            print(f"Not enough data found for issuer {issuer_id}")
            return
        
        # Prepare data for analysis
        df = pd.DataFrame(stocks_data)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        # Calculate indicators and store results
        results = utils.calculate_indicators(df)
        await self.db.store_technical_analysis(
            issuer_id, 
            results['moving_averages'], 
            results['oscillators']
        )
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
