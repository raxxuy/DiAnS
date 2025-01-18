import pandas as pd
import numpy as np
import talib as ta
from datetime import datetime

def clean_nan_values(data):
    """Replace NaN values with 0.0 in nested dictionaries and lists."""
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            if k in ['daily', 'weekly', 'monthly']:
                cleaned[k] = float(v) if not pd.isna(v) else 0.0
            elif k == 'signal':
                cleaned[k] = v if v else 'hold'
            else:
                cleaned[k] = clean_nan_values(v)
        return cleaned
    elif isinstance(data, list):
        return [clean_nan_values(x) for x in data]
    elif isinstance(data, (np.floating, float)) and np.isnan(data):
        return 0.0
    elif isinstance(data, np.floating):
        return float(data)
    return data

def generate_signal(value, low_threshold, high_threshold):
    """Generate trading signal based on indicator value and thresholds."""
    if pd.isna(value):
        return "hold"
    if value < low_threshold:
        return "buy"
    if value > high_threshold:
        return "sell"
    return "hold"

def resample_data(df, period='D'):
    """Resample data to specified period (D=daily, W=weekly, ME=monthly end)."""
    resampled = df.resample(period).agg({
        'max_price': 'max',
        'min_price': 'min',
        'avg_price': 'mean',
        'volume': 'sum'
    }).ffill()
    return resampled.dropna()

def calculate_wema(data, period):
    """Calculate Wilder's Exponential Moving Average."""
    alpha = 1/period
    return data.ewm(alpha=alpha, adjust=False).mean()

def format_indicator_value(value, signal_func=generate_signal, thresholds=None):
    """Format single indicator value with signal."""
    if thresholds is None:
        thresholds = {'low': 30, 'high': 70}
    
    return {
        'value': float(value) if not pd.isna(value) else 0.0,
        'signal': signal_func(value, thresholds['low'], thresholds['high'])
    }

def calculate_moving_averages(df, periods):
    """Calculate all moving averages for different periods."""
    # Sort dataframe by date ascending
    df = df.sort_index()
    
    price = df['avg_price']
    latest_price = price.iloc[-1]
    moving_averages = {}
    
    # Initialize structure for each MA type with names
    ma_names = {
        'sma': 'SMA',
        'ema': 'EMA',
        'wma': 'WMA',
        'wema': 'WEMA',
        'dema': 'DEMA'
    }
    
    for ma_type in ma_names.keys():
        moving_averages[ma_type] = {
            'name': ma_names[ma_type],
            'daily': 0.0,
            'weekly': 0.0,
            'monthly': 0.0,
            'signal': 'hold'
        }
    
    # Calculate for each period
    for period_name, period_value in periods.items():
        if period_name == 'daily':
            period_df = df.copy()
        elif period_name == 'weekly':
            period_df = resample_data(df.copy(), 'W')
        else:  # monthly
            period_df = resample_data(df.copy(), 'ME')
            
        period_price = period_df['avg_price']
        min_periods = {
            'sma': period_value,
            'ema': period_value,
            'wma': period_value,
            'wema': period_value,
            'dema': period_value * 2  # DEMA needs more data points
        }
        
        # SMA
        if len(period_price) >= min_periods['sma']:
            sma = ta.SMA(period_price, timeperiod=period_value).iloc[-1]
            moving_averages['sma'][period_name] = float(sma) if not pd.isna(sma) else 0.0
            if period_name == 'daily':  # Only set signal from daily value
                moving_averages['sma']['signal'] = "buy" if latest_price > sma else "sell" if latest_price < sma else "hold"
        
        # EMA
        if len(period_price) >= min_periods['ema']:
            ema = ta.EMA(period_price, timeperiod=period_value).iloc[-1]
            moving_averages['ema'][period_name] = float(ema) if not pd.isna(ema) else 0.0
            if period_name == 'daily':
                moving_averages['ema']['signal'] = "buy" if latest_price > ema else "sell" if latest_price < ema else "hold"
        
        # WMA
        if len(period_price) >= min_periods['wma']:
            wma = ta.WMA(period_price, timeperiod=period_value).iloc[-1]
            moving_averages['wma'][period_name] = float(wma) if not pd.isna(wma) else 0.0
            if period_name == 'daily':
                moving_averages['wma']['signal'] = "buy" if latest_price > wma else "sell" if latest_price < wma else "hold"
        
        # WEMA
        if len(period_price) >= min_periods['wema']:
            wema = calculate_wema(period_price, period_value).iloc[-1]
            moving_averages['wema'][period_name] = float(wema) if not pd.isna(wema) else 0.0
            if period_name == 'daily':
                moving_averages['wema']['signal'] = "buy" if latest_price > wema else "sell" if latest_price < wema else "hold"
        
        # DEMA
        if len(period_price) >= min_periods['dema']:
            dema = ta.DEMA(period_price, timeperiod=period_value).iloc[-1]
            moving_averages['dema'][period_name] = float(dema) if not pd.isna(dema) else 0.0
            if period_name == 'daily':
                moving_averages['dema']['signal'] = "buy" if latest_price > dema else "sell" if latest_price < dema else "hold"

    return moving_averages

def calculate_oscillators(df, periods):
    """Calculate all oscillator indicators for different periods."""
    # Sort dataframe by date ascending
    df = df.sort_index()
    
    oscillators = {}
    
    # Initialize structure for each oscillator with names
    oscillator_names = {
        'rsi': 'RSI',
        'macd': 'MACD',
        'stochastic': 'Stochastic',
        'cci': 'CCI',
        'williamsR': 'Williams %R'
    }
    
    for osc_type in oscillator_names.keys():
        oscillators[osc_type] = {
            'name': oscillator_names[osc_type],
            'daily': 0.0,
            'weekly': 0.0,
            'monthly': 0.0,
            'signal': 'hold'
        }
    
    # Calculate for each period
    for period_name, period_value in periods.items():
        if period_name == 'daily':
            period_df = df.copy()
        elif period_name == 'weekly':
            period_df = resample_data(df.copy(), 'W')
        else:  # monthly
            period_df = resample_data(df.copy(), 'ME')
            
        price = period_df['avg_price']
        high = period_df['max_price']
        low = period_df['min_price']
        
        # RSI
        if len(price) >= period_value:
            rsi = ta.RSI(price, timeperiod=period_value).iloc[-1]
            oscillators['rsi'][period_name] = float(rsi) if not pd.isna(rsi) else 0.0
            if period_name == 'daily':
                oscillators['rsi']['signal'] = generate_signal(rsi, 30, 70)
        
        # MACD - needs at least 26 + 9 periods
        if len(price) >= 35:  # 26 (slow) + 9 (signal)
            macd, signal, hist = ta.MACD(price, fastperiod=12, slowperiod=26, signalperiod=9)
            macd_value = macd.iloc[-1]
            signal_value = signal.iloc[-1]
            oscillators['macd'][period_name] = float(macd_value) if not pd.isna(macd_value) else 0.0
            if period_name == 'daily':
                oscillators['macd']['signal'] = "buy" if macd_value > signal_value else "sell" if macd_value < signal_value else "hold"
        
        # Stochastic
        if len(price) >= period_value:
            slowk, slowd = ta.STOCH(high, low, price, fastk_period=period_value, slowk_period=3, slowd_period=3)
            stoch_k = slowk.iloc[-1]
            oscillators['stochastic'][period_name] = float(stoch_k) if not pd.isna(stoch_k) else 0.0
            if period_name == 'daily':
                oscillators['stochastic']['signal'] = generate_signal(stoch_k, 20, 80)
        
        # CCI
        if len(price) >= period_value:
            cci = ta.CCI(high, low, price, timeperiod=period_value).iloc[-1]
            oscillators['cci'][period_name] = float(cci) if not pd.isna(cci) else 0.0
            if period_name == 'daily':
                oscillators['cci']['signal'] = generate_signal(cci, -100, 100)
        
        # Williams %R
        if len(price) >= period_value:
            willr = ta.WILLR(high, low, price, timeperiod=period_value).iloc[-1]
            oscillators['williamsR'][period_name] = float(willr) if not pd.isna(willr) else 0.0
            if period_name == 'daily':
                oscillators['williamsR']['signal'] = generate_signal(willr, -80, -20)

    return oscillators

def calculate_indicators(df):
    """Calculate all technical indicators for different time periods."""
    periods = {
        'daily': 14,  # Standard period for RSI and other oscillators
        'weekly': 10, # Balanced period for weekly analysis
        'monthly': 7  # Longer period for monthly trends
    }
    
    moving_averages = calculate_moving_averages(df, periods)
    oscillators = calculate_oscillators(df, periods)
    
    return clean_nan_values({
        'moving_averages': moving_averages,
        'oscillators': oscillators
    })