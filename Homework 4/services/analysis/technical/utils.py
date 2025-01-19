from typing import Dict, Any, Union, TypedDict
import pandas as pd
import numpy as np
import talib as ta

# Type aliases
Number = Union[int, float]
PriceData = pd.Series
DataFrame = pd.DataFrame

# Type definitions for indicator results
class IndicatorValue(TypedDict):
    value: float
    signal: str

class IndicatorPeriods(TypedDict):
    daily: float
    weekly: float
    monthly: float
    signal: str

class MovingAverages(TypedDict):
    sma: IndicatorPeriods
    ema: IndicatorPeriods
    wma: IndicatorPeriods
    wema: IndicatorPeriods
    dema: IndicatorPeriods

class Oscillators(TypedDict):
    rsi: IndicatorPeriods
    macd: IndicatorPeriods
    stochastic: IndicatorPeriods
    cci: IndicatorPeriods
    williamsR: IndicatorPeriods

class TechnicalIndicators(TypedDict):
    moving_averages: MovingAverages
    oscillators: Oscillators


def clean_nan_values(data: Any) -> Any:
    """Replace NaN values with appropriate defaults in nested structures"""
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


def generate_signal(value: float, low_threshold: float, high_threshold: float) -> str:
    """Generate trading signal based on indicator value and thresholds"""
    if pd.isna(value):
        return "hold"
    if value < low_threshold:
        return "buy"
    if value > high_threshold:
        return "sell"
    return "hold"


def resample_data(df: DataFrame, period: str = 'D') -> DataFrame:
    """Resample data to specified period"""
    resampled = df.resample(period).agg({
        'max_price': 'max',
        'min_price': 'min',
        'avg_price': 'mean',
        'volume': 'sum'
    }).ffill()
    return resampled.dropna()


def calculate_wema(data: PriceData, timeperiod: int) -> PriceData:
    """Calculate Wilder's Exponential Moving Average"""
    alpha = 1/timeperiod
    return data.ewm(alpha=alpha, adjust=False).mean()


def format_indicator_value(value: float, signal_func=generate_signal, 
                         thresholds: Dict[str, float] = None) -> IndicatorValue:
    """Format single indicator value with signal"""
    if thresholds is None:
        thresholds = {'low': 30, 'high': 70}
    
    return {
        'value': float(value) if not pd.isna(value) else 0.0,
        'signal': signal_func(value, thresholds['low'], thresholds['high'])
    }


def calculate_moving_averages(df: DataFrame, periods: Dict[str, int]) -> MovingAverages:
    """Calculate all moving averages for different periods"""
    df = df.sort_index()  # Sort by date ascending
    
    price = df['avg_price']
    latest_price = price.iloc[-1]
    moving_averages: MovingAverages = {}
    
    # Initialize structure for each MA type
    ma_types = {
        'sma': ('SMA', ta.SMA),
        'ema': ('EMA', ta.EMA),
        'wma': ('WMA', ta.WMA),
        'wema': ('WEMA', calculate_wema),
        'dema': ('DEMA', ta.DEMA)
    }
    
    for ma_key, (ma_name, ma_func) in ma_types.items():
        moving_averages[ma_key] = {
            'name': ma_name,
            'daily': 0.0,
            'weekly': 0.0,
            'monthly': 0.0,
            'signal': 'hold'
        }
    
    # Calculate for each period
    for period_name, period_value in periods.items():
        period_df = df.copy() if period_name == 'daily' else \
                   resample_data(df.copy(), 'W') if period_name == 'weekly' else \
                   resample_data(df.copy(), 'ME')
            
        period_price = period_df['avg_price']
        min_periods = period_value * 2 if 'dema' else period_value
        
        for ma_key, (_, ma_func) in ma_types.items():
            if len(period_price) >= min_periods:
                ma_value = ma_func(period_price, timeperiod=period_value).iloc[-1]
                moving_averages[ma_key][period_name] = float(ma_value) if not pd.isna(ma_value) else 0.0
                
                if period_name == 'daily':  # Only set signal from daily value
                    moving_averages[ma_key]['signal'] = (
                        "buy" if latest_price > ma_value else 
                        "sell" if latest_price < ma_value else 
                        "hold"
                    )

    return moving_averages


def calculate_oscillators(df: DataFrame, periods: Dict[str, int]) -> Oscillators:
    """Calculate all oscillator indicators for different periods"""
    df = df.sort_index()  # Sort by date ascending
    oscillators: Oscillators = {}
    
    # Initialize structure for each oscillator
    oscillator_types = {
        'rsi': ('RSI', {'low': 30, 'high': 70}),
        'macd': ('MACD', None),  # MACD uses different signal logic
        'stochastic': ('Stochastic', {'low': 20, 'high': 80}),
        'cci': ('CCI', {'low': -100, 'high': 100}),
        'williamsR': ('Williams %R', {'low': -80, 'high': -20})
    }
    
    for osc_key, (osc_name, _) in oscillator_types.items():
        oscillators[osc_key] = {
            'name': osc_name,
            'daily': 0.0,
            'weekly': 0.0,
            'monthly': 0.0,
            'signal': 'hold'
        }
    
    # Calculate for each period
    for period_name, period_value in periods.items():
        period_df = df.copy() if period_name == 'daily' else \
                   resample_data(df.copy(), 'W') if period_name == 'weekly' else \
                   resample_data(df.copy(), 'ME')
            
        price = period_df['avg_price']
        high = period_df['max_price']
        low = period_df['min_price']
        
        # Calculate each oscillator
        if len(price) >= period_value:
            # RSI
            rsi = ta.RSI(price, timeperiod=period_value).iloc[-1]
            oscillators['rsi'][period_name] = float(rsi) if not pd.isna(rsi) else 0.0
            if period_name == 'daily':
                oscillators['rsi']['signal'] = generate_signal(rsi, 30, 70)
        
            # MACD
            if len(price) >= 35:  # 26 (slow) + 9 (signal)
                macd, signal, _ = ta.MACD(price, fastperiod=12, slowperiod=26, signalperiod=9)
                macd_value = macd.iloc[-1]
                signal_value = signal.iloc[-1]
                oscillators['macd'][period_name] = float(macd_value) if not pd.isna(macd_value) else 0.0
                if period_name == 'daily':
                    oscillators['macd']['signal'] = (
                        "buy" if macd_value > signal_value else 
                        "sell" if macd_value < signal_value else 
                        "hold"
                    )
        
            # Stochastic
            slowk, _ = ta.STOCH(high, low, price, fastk_period=period_value, slowk_period=3, slowd_period=3)
            stoch_k = slowk.iloc[-1]
            oscillators['stochastic'][period_name] = float(stoch_k) if not pd.isna(stoch_k) else 0.0
            if period_name == 'daily':
                oscillators['stochastic']['signal'] = generate_signal(stoch_k, 20, 80)
        
            # CCI
            cci = ta.CCI(high, low, price, timeperiod=period_value).iloc[-1]
            oscillators['cci'][period_name] = float(cci) if not pd.isna(cci) else 0.0
            if period_name == 'daily':
                oscillators['cci']['signal'] = generate_signal(cci, -100, 100)
        
            # Williams %R
            willr = ta.WILLR(high, low, price, timeperiod=period_value).iloc[-1]
            oscillators['williamsR'][period_name] = float(willr) if not pd.isna(willr) else 0.0
            if period_name == 'daily':
                oscillators['williamsR']['signal'] = generate_signal(willr, -80, -20)

    return oscillators


def calculate_indicators(df: DataFrame) -> TechnicalIndicators:
    """Calculate all technical indicators for different time periods"""
    periods = {
        'daily': 14,   # Standard period for RSI and other oscillators
        'weekly': 10,  # Balanced period for weekly analysis
        'monthly': 4   # Longer period for monthly trends
    }
    
    moving_averages = calculate_moving_averages(df, periods)
    oscillators = calculate_oscillators(df, periods)
    
    return clean_nan_values({
        'moving_averages': moving_averages,
        'oscillators': oscillators
    })