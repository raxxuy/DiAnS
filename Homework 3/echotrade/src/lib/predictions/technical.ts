import { stockhistory } from "@prisma/client";

import {
  SMA,
  EMA,
  WMA,
  WEMA,
  TRIX,
  RSI,
  MACD,
  Stochastic,
  CCI,
  WilliamsR,
} from "technicalindicators";

interface StockData {
  date: Date;
  last_trade_price: number;
  max_price: number;
  min_price: number;
}

interface TechnicalIndicator {
  date: Date;
  value: number | number[];
  signal?: "buy" | "sell" | "hold";
}

interface AnalysisResult {
  period: "day" | "week" | "month";
  movingAverages: {
    sma: TechnicalIndicator[];
    ema: TechnicalIndicator[];
    wma: TechnicalIndicator[];
    wema: TechnicalIndicator[];
    trix: TechnicalIndicator[];
  };
  oscillators: {
    rsi: TechnicalIndicator[];
    macd: TechnicalIndicator[];
    stochastic: TechnicalIndicator[];
    cci: TechnicalIndicator[];
    williamsR: TechnicalIndicator[];
  };
}

export function convertStockHistory(rawData: stockhistory[]): StockData[] {
  return rawData.map(item => ({
    date: new Date(item.date),
    last_trade_price: parseFloat(item.last_trade_price),
    max_price: parseFloat(item.max_price),
    min_price: parseFloat(item.min_price)
  }));
}

function calculateMovingAverages(data: StockData[], period: number) {
  const prices = data.map(d => d.last_trade_price);
  const dates = data.map(d => d.date);

  const smaValues = SMA.calculate({ period, values: prices });
  const emaValues = EMA.calculate({ period, values: prices });
  const wmaValues = WMA.calculate({ period, values: prices });
  const wemaValues = WEMA.calculate({ period, values: prices });
  const trixValues = TRIX.calculate({ period, values: prices });

  // Pad the beginning with nulls to match the original data length
  const padding = data.length - smaValues.length;
  const paddedDates = dates.slice(padding);

  return {
    sma: smaValues.map((value, i) => ({
      date: paddedDates[i],
      value,
      signal: generateSignal(value, prices[i + padding]),
    })),
    ema: emaValues.map((value, i) => ({
      date: paddedDates[i],
      value,
      signal: generateSignal(value, prices[i + padding]),
    })),
    wma: wmaValues.map((value, i) => ({
      date: paddedDates[i],
      value,
      signal: generateSignal(value, prices[i + padding]),
    })),
    wema: wemaValues.map((value, i) => ({
      date: paddedDates[i],
      value,
      signal: generateSignal(value, prices[i + padding]),
    })),
    trix: trixValues.map((value, i) => ({
      date: paddedDates[i],
      value,
      signal: generateSignal(value, prices[i + padding]),
    })),
  };
}

function calculateOscillators(data: StockData[], period: number) {
  const prices = data.map(d => d.last_trade_price);
  const high = data.map(d => d.max_price);
  const low = data.map(d => d.min_price);
  const dates = data.map(d => d.date);

  const rsiValues = RSI.calculate({ period, values: prices });
  const macdValues = MACD.calculate({
    SimpleMAOscillator: false,
    SimpleMASignal: false,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    values: prices,
  });
  const stochValues = Stochastic.calculate({
    high,
    low,
    close: prices,
    period,
    signalPeriod: 3,
  });
  const cciValues = CCI.calculate({
    high,
    low,
    close: prices,
    period,
  });
  const williamsRValues = WilliamsR.calculate({
    high,
    low,
    close: prices,
    period,
  });

  const padding = data.length - rsiValues.length;
  const paddedDates = dates.slice(padding);

  return {
    rsi: rsiValues.map((value, i) => ({
      date: paddedDates[i],
      value,
      signal: generateOscillatorSignal("rsi", value),
    })),
    macd: macdValues.map((value: any, i) => ({
      date: paddedDates[i],
      value: [value.MACD, value.signal, value.histogram],
      signal: generateMACDSignal({
        MACD: value.MACD,
        signal: value.signal,
        histogram: value.histogram
      }),
    })),
    stochastic: stochValues.map((value, i) => ({
      date: paddedDates[i],
      value: [value.k, value.d],
      signal: generateStochasticSignal(value),
    })),
    cci: cciValues.map((value, i) => ({
      date: paddedDates[i],
      value,
      signal: generateCCISignal(value),
    })),
    williamsR: williamsRValues.map((value, i) => ({
      date: paddedDates[i],
      value,
      signal: generateWilliamsRSignal(value),
    })),
  };
}

function generateSignal(indicatorValue: number, price: number): "buy" | "sell" | "hold" {
  if (price > indicatorValue) return "buy";
  if (price < indicatorValue) return "sell";
  return "hold";
}

function generateOscillatorSignal(type: string, value: number): "buy" | "sell" | "hold" {
  if (type === "rsi") {
    if (value < 30) return "buy";
    if (value > 70) return "sell";
    return "hold";
  }
  return "hold";
}

function generateMACDSignal(value: { MACD: number; signal: number; histogram: number }): "buy" | "sell" | "hold" {
  if (value.MACD > value.signal) return "buy";
  if (value.MACD < value.signal) return "sell";
  return "hold";
}

function generateStochasticSignal(value: { k: number; d: number }): "buy" | "sell" | "hold" {
  if (value.k < 20 && value.d < 20) return "buy";
  if (value.k > 80 && value.d > 80) return "sell";
  return "hold";
}

function generateCCISignal(value: number): "buy" | "sell" | "hold" {
  if (value < -100) return "buy";
  if (value > 100) return "sell";
  return "hold";
}

function generateWilliamsRSignal(value: number): "buy" | "sell" | "hold" {
  if (value < -80) return "buy";
  if (value > -20) return "sell";
  return "hold";
}

export function analyzeTechnicalIndicators(rawData: stockhistory[]): AnalysisResult[] {
  const data = convertStockHistory(rawData);
  
  const minDataPoints = {
    day: 14,
    week: 30,
    month: 90
  };

  // Only analyze periods that have enough data
  const periods = Object.entries(minDataPoints)
    .filter(([_, requiredPoints]) => data.length >= requiredPoints)
    .reduce((acc, [period, points]) => ({
      ...acc,
      [period]: points
    }), {} as Record<string, number>);

  if (Object.keys(periods).length === 0) {
    // Not enough data for any analysis
    return [{
      period: "day",
      movingAverages: {
        sma: [], ema: [], wma: [], wema: [], trix: []
      },
      oscillators: {
        rsi: [], macd: [], stochastic: [], cci: [], williamsR: []
      }
    }];
  }

  return Object.entries(periods).map(([periodName, period]) => ({
    period: periodName as "day" | "week" | "month",
    movingAverages: calculateMovingAverages(data, period),
    oscillators: calculateOscillators(data, period),
  }));
}