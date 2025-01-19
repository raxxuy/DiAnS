import { PrismaClient } from "@prisma/client";
import type { 
  issuer as Issuer, 
  company as Company, 
  stockhistory as StockHistory, 
  news as News,
} from "@prisma/client";

// Service types
export type ServiceType = 'issuer' | 'company' | 'stock' | 'news' | 'technical' | 'fundamental' | 'lstm';

export interface BaseService {
  [key: string]: any;
}

export interface CacheableService extends BaseService {
  getAll(prisma: PrismaClient, ...args: any[]): Promise<any>;
  getById(prisma: PrismaClient, id: number, ...args: any[]): Promise<any>;
  getByCode?(prisma: PrismaClient, code: string, ...args: any[]): Promise<any>;
}

// Service Interface Types
export interface IssuerServiceType extends CacheableService {
  getAll(prisma: PrismaClient): Promise<Issuer[]>;
  getByCode(prisma: PrismaClient, code: string): Promise<Issuer | null>;
}

export interface CompanyServiceType extends CacheableService {
  getAll(prisma: PrismaClient, locale: string): Promise<Company[]>;
  getById(prisma: PrismaClient, id: number, locale: string): Promise<Company | null>;
}

export interface StockServiceType extends BaseService {
  getAll(prisma: PrismaClient): Promise<StockHistory[]>;
  getByIssuerId(prisma: PrismaClient, issuerId: number): Promise<StockHistory[]>;
}

export interface NewsServiceType extends CacheableService {
  getAll(prisma: PrismaClient, locale: string): Promise<News[]>;
  getById(prisma: PrismaClient, id: number, locale: string): Promise<News | null>;
}

// Analysis Types
export interface TechnicalAnalysis {
  oscillators: OscillatorAnalysis;
  moving_averages: MovingAverageAnalysis;
}

export interface FundamentalAnalysis {
  sentiment: number;
  recommendation: string;
  newsCount: number;
  latestDate: Date | null;
}

export interface LSTMPrediction {
  prediction_date: string;
  predicted_price: number;
}

export interface IndicatorWithPeriods {
  name: string;
  daily: number;
  weekly: number;
  monthly: number;
  signal: 'buy' | 'sell' | 'hold';
}

export interface MovingAverageAnalysis {
  ema: IndicatorWithPeriods;
  sma: IndicatorWithPeriods;
  wma: IndicatorWithPeriods;
  dema: IndicatorWithPeriods;
  wema: IndicatorWithPeriods;
}

export interface OscillatorAnalysis {
  cci: IndicatorWithPeriods;
  rsi: IndicatorWithPeriods;
  macd: IndicatorWithPeriods;
  stochastic: IndicatorWithPeriods;
  williamsR: IndicatorWithPeriods;
}

// Analysis Service Types
export interface TechnicalAnalyzerServiceType extends BaseService {
  getTechnicalAnalysis(prisma: PrismaClient, issuerId: number): Promise<TechnicalAnalysis | null>;
}

export interface FundamentalAnalyzerServiceType extends BaseService {
  getFundamentalAnalysis(prisma: PrismaClient, issuerId: number): Promise<FundamentalAnalysis | null>;
}

export interface LSTMAnalyzerServiceType extends BaseService {
  getLSTMAnalysis(prisma: PrismaClient, issuerId: number): Promise<LSTMPrediction[] | null>;
}