from typing import List, Tuple, Optional
import numpy as np
from numpy.typing import NDArray
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import os

# Type aliases
FloatArray = NDArray[np.float64]
ModelInput = NDArray[np.float64]
ModelOutput = NDArray[np.float64]
PriceData = List[str]


def prepare_lstm_data(data: PriceData, sequence_length: int) -> Tuple[FloatArray, FloatArray, MinMaxScaler]:
    """Prepare data for LSTM model training"""
    if len(data) < sequence_length:
        return np.array([]), np.array([]), MinMaxScaler()

    # Convert string prices to float array
    prices = np.array([
        float(p.replace(".", "").replace(",", ".")) 
        for p in data
    ]).reshape(-1, 1)
    
    # Scale the data
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(prices)
    
    # Create sequences
    X: List[FloatArray] = []
    y: List[FloatArray] = []
    
    for i in range(len(scaled_data) - sequence_length - 1):
        X.append(scaled_data[i:(i + sequence_length)])
        y.append(scaled_data[i + sequence_length])
        
    return np.array(X), np.array(y), scaler


def build_lstm_model(sequence_length: int, is_large_dataset: bool = False) -> Sequential:
    """Build LSTM model architecture based on dataset size"""
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


def train_lstm_model(
    X: FloatArray,
    y: FloatArray,
    sequence_length: int,
    is_large_dataset: bool,
    model_path: str,
    issuer_id: int
) -> Optional[Sequential]:
    """Train LSTM model with early stopping and checkpoints"""
    train_size = int(len(X) * 0.7)
    if train_size == 0:
        return None

    # Split data into train and validation sets
    X_train, X_val = X[:train_size], X[train_size:]
    y_train, y_val = y[:train_size], y[train_size:]
    
    # Build and compile model
    model = build_lstm_model(sequence_length, is_large_dataset)
    model.compile(optimizer='adam', loss='mse')
    
    # Create model directory if needed
    if not os.path.exists(model_path):
        os.makedirs(model_path)
        
    checkpoint_path = f"{model_path}/lstm_model_{issuer_id}.keras"
    
    # Train model with callbacks
    model.fit(
        X_train, y_train,
        epochs=200 if is_large_dataset else 50,
        batch_size=16 if is_large_dataset else 4,
        validation_data=(X_val, y_val),
        callbacks=[
            ModelCheckpoint(
                checkpoint_path,
                monitor='val_loss',
                save_best_only=True
            ),
            EarlyStopping(
                monitor='val_loss',
                patience=15 if is_large_dataset else 5
            )
        ],
        verbose=0
    )
    
    return load_model(checkpoint_path)


def generate_predictions(
    model: Sequential,
    scaler: MinMaxScaler,
    last_sequence: FloatArray,
    sequence_length: int,
    days_ahead: int = 30
) -> List[float]:
    """Generate future price predictions using trained model"""
    current_sequence = last_sequence.copy()
    predictions: List[float] = []
    
    for _ in range(days_ahead):
        # Predict next value
        pred = model.predict(
            current_sequence.reshape(1, sequence_length, 1),
            verbose=0
        )
        predictions.append(pred[0, 0])
        
        # Update sequence for next prediction
        current_sequence = np.roll(current_sequence, -1, axis=0)
        current_sequence[-1] = pred
    
    # Transform predictions back to original scale
    predictions_array = np.array(predictions).reshape(-1, 1)
    return scaler.inverse_transform(predictions_array).flatten().tolist() 