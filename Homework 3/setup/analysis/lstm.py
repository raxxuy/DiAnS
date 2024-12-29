import numpy as np
import asyncio
import multiprocessing as mp
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import os
from db import Database
from datetime import datetime, timedelta

def process_issuer(data):
    issuer_code, issuer_id, prices = data

    if len(prices) < 10:
        print(f"Skipping {issuer_code} - insufficient data")
        return None
    
    print(f"Training model for {issuer_code}")
    lstm = LSTMPredictor(sequence_length=5 if len(prices) < 50 else 30)
    
    avg_prices = [price['avg_price'] for price in reversed(prices)]
    
    print(f"Training with {len(avg_prices)} days of data for {issuer_code}")

    if not lstm.train(avg_prices, issuer_id):
        print(f"Failed to train model for {issuer_code}")
        return None
    
    predictions = lstm.predict(avg_prices)
    
    if not predictions:
        print(f"Failed to generate predictions for {issuer_code}")
        return None
    
    print(f"Successfully trained model for {issuer_code}")
    return (issuer_id, predictions)

class LSTMPredictor:
    def __init__(self, sequence_length=30):
        self.sequence_length = sequence_length
        self.model = None
        self.scaler = MinMaxScaler()
        self.model_path = 'models'
        self.is_large_dataset = sequence_length > 5
        
        if not os.path.exists(self.model_path):
            os.makedirs(self.model_path)

    def prepare_data(self, data):
        if len(data) < self.sequence_length:
            return np.array([]), np.array([])

        prices = np.array([float(p.replace(".", "").replace(",", ".")) for p in data]).reshape(-1, 1)
        scaled_data = self.scaler.fit_transform(prices)
        
        X, y = [], []
        for i in range(len(scaled_data) - self.sequence_length - 1):
            X.append(scaled_data[i:(i + self.sequence_length)])
            y.append(scaled_data[i + self.sequence_length])
            
        return np.array(X), np.array(y)

    def build_model(self):
        if self.is_large_dataset:
            return Sequential([
                Input(shape=(self.sequence_length, 1)),
                LSTM(128, return_sequences=True),
                Dropout(0.2),
                LSTM(64, return_sequences=True),
                Dropout(0.2),
                LSTM(32, return_sequences=False),
                Dropout(0.2),
                Dense(16, activation='relu'),
                Dense(1)
            ])
        return Sequential([
            Input(shape=(self.sequence_length, 1)),
            LSTM(32, return_sequences=False),
            Dropout(0.2),
            Dense(1)
        ])

    def train(self, avg_prices, issuer_id):
        X, y = self.prepare_data(avg_prices)
        if len(X) == 0 or len(y) == 0:
            return None
        
        train_size = int(len(X) * 0.7)
        if train_size == 0:
            return None

        X_train, X_val = X[:train_size], X[train_size:]
        y_train, y_val = y[:train_size], y[train_size:]
        
        model = self.build_model()
        model.compile(optimizer='adam', loss='mse')
        
        checkpoint_path = f"{self.model_path}/lstm_model_{issuer_id}.keras"
        
        model.fit(
            X_train, y_train,
            epochs=200 if self.is_large_dataset else 50,
            batch_size=16 if self.is_large_dataset else 4,
            validation_data=(X_val, y_val),
            callbacks=[
                ModelCheckpoint(checkpoint_path, monitor='val_loss', save_best_only=True),
                EarlyStopping(monitor='val_loss', patience=15 if self.is_large_dataset else 5)
            ],
            verbose=0
        )
        
        self.model = load_model(checkpoint_path)
        return True

    def predict(self, avg_prices, days_ahead=30):
        prices = np.array([float(p.replace(".", "").replace(",", ".")) 
                          for p in avg_prices[-self.sequence_length:]]).reshape(-1, 1)
        
        scaled_sequence = self.scaler.transform(prices)
        current_sequence = scaled_sequence.copy()
        predictions = []
        
        for _ in range(days_ahead):
            pred = self.model.predict(current_sequence.reshape(1, self.sequence_length, 1), verbose=0)
            predictions.append(pred[0, 0])
            current_sequence = np.roll(current_sequence, -1, axis=0)
            current_sequence[-1] = pred
        
        predictions = np.array(predictions).reshape(-1, 1)
        return self.scaler.inverse_transform(predictions).flatten().tolist()

async def main():
    db_params = {"user": "postgres", "password": "postgres", "database": "DB"}
    db = Database(**db_params)
    
    await db.connect()
    await db.create_tables()
    
    try:
        issuer_ids = await db.get_issuers()
        today = datetime.now().date()
        
        issuer_data = []

        for issuer_code, issuer_id in issuer_ids:
            prices = await db.get_stock_history(issuer_id)
            if prices:
                price_list = [{'avg_price': p['avg_price'], 'date': p['date'].isoformat()} 
                            for p in prices]
                issuer_data.append((issuer_code, issuer_id, price_list))
        
        with mp.Pool(processes=min(3, len(issuer_data))) as pool:
            results = pool.map(process_issuer, issuer_data)
        
        start_date = today + timedelta(days=1)
        for result in results:
            if result:
                issuer_id, predictions = result
                await db.save_lstm_predictions(issuer_id, predictions, start_date)
                print(f"Saved predictions for issuer {issuer_id}")
    finally:
        await db.close()

if __name__ == "__main__":
    mp.freeze_support()
    asyncio.run(main())