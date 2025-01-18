import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import os
from datetime import datetime, timedelta

def prepare_lstm_data(data, sequence_length):
    """Prepare data for LSTM model training"""
    if len(data) < sequence_length:
        return np.array([]), np.array([])

    prices = np.array([float(p.replace(".", "").replace(",", ".")) for p in data]).reshape(-1, 1)
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(prices)
    
    X, y = [], []
    for i in range(len(scaled_data) - sequence_length - 1):
        X.append(scaled_data[i:(i + sequence_length)])
        y.append(scaled_data[i + sequence_length])
        
    return np.array(X), np.array(y), scaler

def build_lstm_model(sequence_length, is_large_dataset=False):
    if is_large_dataset:
        return Sequential([
            Input(shape=(sequence_length, 1)),
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
        Input(shape=(sequence_length, 1)),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(1)
    ])

def train_lstm_model(X, y, sequence_length, is_large_dataset, model_path, issuer_id):
    """Train LSTM model with early stopping and checkpoints"""
    train_size = int(len(X) * 0.7)
    if train_size == 0:
        return None

    X_train, X_val = X[:train_size], X[train_size:]
    y_train, y_val = y[:train_size], y[train_size:]
    
    model = build_lstm_model(sequence_length, is_large_dataset)
    model.compile(optimizer='adam', loss='mse')
    
    if not os.path.exists(model_path):
        os.makedirs(model_path)
        
    checkpoint_path = f"{model_path}/lstm_model_{issuer_id}.keras"
    
    model.fit(
        X_train, y_train,
        epochs=200 if is_large_dataset else 50,
        batch_size=16 if is_large_dataset else 4,
        validation_data=(X_val, y_val),
        callbacks=[
            ModelCheckpoint(checkpoint_path, monitor='val_loss', save_best_only=True),
            EarlyStopping(monitor='val_loss', patience=15 if is_large_dataset else 5)
        ],
        verbose=0
    )
    
    return load_model(checkpoint_path)

def generate_predictions(model, scaler, last_sequence, sequence_length, days_ahead=30):
    current_sequence = last_sequence.copy()
    predictions = []
    
    for _ in range(days_ahead):
        pred = model.predict(current_sequence.reshape(1, sequence_length, 1), verbose=0)
        predictions.append(pred[0, 0])
        current_sequence = np.roll(current_sequence, -1, axis=0)
        current_sequence[-1] = pred
    
    predictions = np.array(predictions).reshape(-1, 1)
    return scaler.inverse_transform(predictions).flatten().tolist() 