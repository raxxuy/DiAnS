import os
import sys
import utils
import asyncio
import numpy as np
from typing import List, Tuple, Dict, Any
from dotenv import load_dotenv
from datetime import datetime, timedelta

parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(parent_dir)

load_dotenv()

from shared.base_analyzer import BaseAnalyzer
from shared.decorators import MultiProcessAnalyzer, LoggerAnalyzer

# Type aliases
StockPrice = Dict[str, Any]  # {'avg_price': str, 'date': str}
IssuerData = Tuple[str, int, List[StockPrice]]  # (issuer_code, issuer_id, stock_prices)


class LSTMAnalyzer(BaseAnalyzer[IssuerData]):
    """LSTM-based analyzer for predicting future stock prices.
    
    This analyzer uses LSTM (Long Short-Term Memory) neural networks to predict
    future stock prices based on historical data. It handles both small and large
    datasets with different model architectures.
    """
    
    def __init__(self, db_params: Dict[str, str], model_path: str = 'models') -> None:
        """Initialize the LSTM analyzer"""
        super().__init__(db_params)
        self.model_path = model_path
        
    async def connect_db(self) -> None:
        """Connect to database and create required tables."""
        await self.db.connect()
        await self.db.create_lstm_predictions_table()
        
    async def fetch_items(self) -> List[IssuerData]:
        """Fetch stock data for all issuers with sufficient history"""
        issuer_data: List[IssuerData] = []
        issuer_ids = await self.db.get_issuers()
        
        for issuer_code, issuer_id in issuer_ids:
            stocks = await self.db.get_issuer_stocks(issuer_id)
            if stocks:
                stock_list = [
                    {'avg_price': p['avg_price'], 'date': p['date'].isoformat()} 
                    for p in stocks
                ]
                issuer_data.append((issuer_code, issuer_id, stock_list))
                
        return issuer_data
    
    async def process_item(self, item: IssuerData) -> None:
        """Process a single issuer's data to generate predictions"""
        issuer_code, issuer_id, prices = item
        
        creation_date = await self.db.get_recent_lstm_prediction_creation_date(issuer_id)
        if creation_date and creation_date == datetime.now().date():
            print(f"Skipping {issuer_code} - already has predictions for today")
            return
        
        if len(prices) < 10:
            print(f"Skipping {issuer_code} - insufficient data (need at least 10 data points)")
            return
        
        print(f"Training model for {issuer_code}")
        
        # Determine sequence length based on data size
        sequence_length = 5 if len(prices) < 50 else 30
        is_large_dataset = sequence_length > 5
        
        try:
            # Prepare data for LSTM
            avg_prices = [price['avg_price'] for price in reversed(prices)]
            X, y, scaler = utils.prepare_lstm_data(avg_prices, sequence_length)
            
            if len(X) == 0 or len(y) == 0:
                print(f"Failed to prepare data for {issuer_code} - invalid data format")
                return
                
            # Train LSTM model
            model = utils.train_lstm_model(
                X, y, sequence_length, is_large_dataset, 
                self.model_path, issuer_id
            )
            
            if model is None:
                print(f"Failed to train model for {issuer_code} - training error")
                return
                
            # Prepare last sequence for prediction
            last_sequence = scaler.transform(
                np.array([
                    float(p.replace(".", "").replace(",", ".")) 
                    for p in avg_prices[-sequence_length:]
                ]).reshape(-1, 1)
            )
            
            # Generate future predictions
            predictions = utils.generate_predictions(
                model, scaler, last_sequence, sequence_length
            )
            
            if not predictions:
                print(f"Failed to generate predictions for {issuer_code} - prediction error")
                return
                
            # Save predictions to database
            start_date = datetime.now().date() + timedelta(days=1)
            await self.db.save_lstm_predictions(issuer_id, predictions, start_date)
            print(f"Successfully processed {issuer_code}")
            
        except Exception as e:
            print(f"Error processing {issuer_code}: {str(e)}")


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
