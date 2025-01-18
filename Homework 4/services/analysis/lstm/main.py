import os
import sys
import utils
import asyncio
import numpy as np
from dotenv import load_dotenv
from datetime import datetime, timedelta

parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(parent_dir)

load_dotenv()

from shared.base_analyzer import BaseAnalyzer
from shared.decorators import MultiProcessAnalyzer, LoggerAnalyzer


class LSTMAnalyzer(BaseAnalyzer):
    def __init__(self, db_params, model_path='models'):
        super().__init__(db_params)
        self.model_path = model_path
        
    async def connect_db(self):
        await self.db.connect()
        await self.db.create_lstm_predictions_table()
        
    async def fetch_items(self):
        issuer_data = []
        issuer_ids = await self.db.get_issuers()
        
        for issuer_code, issuer_id in issuer_ids:
            stocks = await self.db.get_issuer_stocks(issuer_id)
            if stocks:
                stock_list = [{'avg_price': p['avg_price'], 'date': p['date'].isoformat()} 
                            for p in stocks]
                issuer_data.append((issuer_code, issuer_id, stock_list))
                
        return issuer_data
    
    async def process_item(self, item):
        issuer_code, issuer_id, prices = item
        
        if len(prices) < 10:
            print(f"Skipping {issuer_code} - insufficient data")
            return
        
        print(f"Training model for {issuer_code}")
        sequence_length = 5 if len(prices) < 50 else 30
        is_large_dataset = sequence_length > 5
        
        # Prepare data
        avg_prices = [price['avg_price'] for price in reversed(prices)]
        X, y, scaler = utils.prepare_lstm_data(avg_prices, sequence_length)
        
        if len(X) == 0 or len(y) == 0:
            print(f"Failed to prepare data for {issuer_code}")
            return
            
        # Train model
        model = utils.train_lstm_model(X, y, sequence_length, is_large_dataset, 
                               self.model_path, issuer_id)
        
        if model is None:
            print(f"Failed to train model for {issuer_code}")
            return
            
        # Generate predictions
        last_sequence = scaler.transform(
            np.array([float(p.replace(".", "").replace(",", ".")) 
                     for p in avg_prices[-sequence_length:]]).reshape(-1, 1)
        )
        
        predictions = utils.generate_predictions(model, scaler, last_sequence, sequence_length)
        
        if not predictions:
            print(f"Failed to generate predictions for {issuer_code}")
            return
            
        start_date = datetime.now().date() + timedelta(days=1)
        await self.db.save_lstm_predictions(issuer_id, predictions, start_date)
        print(f"Successfully processed {issuer_code}")


if __name__ == "__main__":
    db_params = {
        "host": os.getenv("DB_HOST", "localhost"),
        "database": os.getenv("DB_DATABASE", "postgres"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres")
    }
    
    analyzer = LSTMAnalyzer(db_params)
    analyzer = MultiProcessAnalyzer(analyzer, process_count=4)
    analyzer = LoggerAnalyzer(analyzer)
    asyncio.run(analyzer.execute_analysis())
