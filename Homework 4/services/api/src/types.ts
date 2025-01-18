import { PrismaClient } from "@prisma/client";
import type { 
  issuer as Issuer, 
  company as Company, 
  stockhistory as StockHistory, 
  news as News,
} from "@prisma/client";

export type TechnicalAnalysis = {
  oscillators: OscillatorAnalysis;
  moving_averages: MovingAverageAnalysis;
}

export type MovingAverageAnalysis = {
  ema: IndicatorWithPeriods;
  sma: IndicatorWithPeriods;
  wma: IndicatorWithPeriods;
  dema: IndicatorWithPeriods;
  wema: IndicatorWithPeriods;
};

export type OscillatorAnalysis = {
  cci: IndicatorWithPeriods;
  rsi: IndicatorWithPeriods;
  macd: IndicatorWithPeriods;
  stochastic: IndicatorWithPeriods;
  williamsR: IndicatorWithPeriods;
};

export type IndicatorWithPeriods = {
  name: string;
  daily: number;
  weekly: number;
  monthly: number;
  signal: 'buy' | 'sell' | 'hold';
};

export type IssuerServiceType = {
  getAll: (prisma: PrismaClient) => Promise<Issuer[]>;
  getByCode: (prisma: PrismaClient, code: string) => Promise<Issuer | null>;
};

export type CompanyServiceType = {
  getAll: (prisma: PrismaClient, locale: string) => Promise<Company[]>;
  getById: (prisma: PrismaClient, id: number, locale: string) => Promise<Company | null>;
};

export type StockServiceType = {
  getAll: (prisma: PrismaClient) => Promise<StockHistory[]>;
  getByIssuerId: (prisma: PrismaClient, issuerId: number) => Promise<StockHistory[]>;
};

export type NewsServiceType = {
  getAll: (prisma: PrismaClient, locale: string) => Promise<News[]>;
  getById: (prisma: PrismaClient, id: number, locale: string) => Promise<News | null>;
};

export type TechnicalAnalyzerServiceType = {
  getTechnicalAnalysis: (prisma: PrismaClient, issuerId: number) => Promise<TechnicalAnalysis | null>;
};

export type FundamentalAnalyzerServiceType = {
  getFundamentalAnalysis: (prisma: PrismaClient, issuerId: number) => Promise<FundamentalAnalysis | null>;
};

export type LSTMAnalyzerServiceType = {
  getLSTMAnalysis: (prisma: PrismaClient, issuerId: number) => Promise<LSTMPrediction[] | null>;
};

export type FundamentalAnalysis = {
  sentiment: number;
  recommendation: string;
  newsCount: number;
  latestDate: Date | null;
};

export type LSTMPrediction = {
  prediction_date: string;
  predicted_price: number;
};