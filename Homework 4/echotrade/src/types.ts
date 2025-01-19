export type FundamentalAnalysis = {
  sentiment: number;
  recommendation: string;
  newsCount: number;
  latestDate: Date | null;
}

export type TechnicalAnalysis = {
  oscillators: OscillatorAnalysis;
  moving_averages: MovingAverageAnalysis;
}

type OscillatorAnalysis = {
  cci: IndicatorWithPeriods;
  rsi: IndicatorWithPeriods;
  macd: IndicatorWithPeriods;
  stochastic: IndicatorWithPeriods;
  williamsR: IndicatorWithPeriods;
}

type MovingAverageAnalysis = {
  ema: IndicatorWithPeriods;
  sma: IndicatorWithPeriods;
  wma: IndicatorWithPeriods;
  dema: IndicatorWithPeriods;
  wema: IndicatorWithPeriods;
}

type IndicatorWithPeriods = {
  name: string;
  daily: number;
  weekly: number;
  monthly: number;
  signal: 'buy' | 'sell' | 'hold';
}
