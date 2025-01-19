import { PrismaClient } from "@prisma/client";
import {
  IssuerServiceType,
  CompanyServiceType,
  StockServiceType,
  NewsServiceType,
  TechnicalAnalyzerServiceType,
  FundamentalAnalyzerServiceType,
  LSTMAnalyzerServiceType,
  TechnicalAnalysis,
  FundamentalAnalysis,
  LSTMPrediction
} from "./types";

/**
 * Base class for implementing singleton pattern
 */
abstract class SingletonService {
  protected constructor() {}

  protected static createInstance<T>(this: new () => T): T {
    if (!(this as any).instance) {
      (this as any).instance = new this();
    }
    return (this as any).instance;
  }
}

/**
 * Service for managing issuer data
 */
export class IssuerService extends SingletonService implements IssuerServiceType {
  private static instance: IssuerService;

  private constructor() {
    super();
  }
  static getInstance(): IssuerService {
    return super.createInstance<IssuerService>();
  }

  async getAll(prisma: PrismaClient) {
    return await prisma.issuer.findMany();
  }

  async getById(prisma: PrismaClient, id: number) {
    return await prisma.issuer.findUnique({ where: { id } });
  }

  async getByCode(prisma: PrismaClient, code: string) {
    return await prisma.issuer.findUnique({ where: { code } });
  }
}

/**
 * Service for managing company data
 */
export class CompanyService extends SingletonService implements CompanyServiceType {
  private static instance: CompanyService;

  private constructor() {
    super();
  }

  static getInstance(): CompanyService {
    return super.createInstance<CompanyService>();
  }

  async getAll(prisma: PrismaClient, locale: string) {
    return locale === "en" 
      ? await prisma.company.findMany() 
      : await prisma.company_mk.findMany();
  }

  async getById(prisma: PrismaClient, id: number, locale: string) {
    return locale === "en"
      ? await prisma.company.findUnique({ where: { id } })
      : await prisma.company_mk.findUnique({ where: { id } });
  }

  async getByCode(prisma: PrismaClient, code: string, locale: string) {}
}

/**
 * Service for managing stock history data
 */
export class StockService extends SingletonService implements StockServiceType {
  private static instance: StockService;

  private constructor() {
    super();
  }

  static getInstance(): StockService {
    return super.createInstance<StockService>();
  }

  async getAll(prisma: PrismaClient) {
    return await prisma.stockhistory.findMany({ 
      include: { issuer: true } 
    });
  }

  async getByIssuerId(prisma: PrismaClient, issuerId: number) {
    return await prisma.stockhistory.findMany({
      where: { issuer_id: issuerId },
      orderBy: { date: 'desc' }
    });
  }
}

/**
 * Service for managing news data
 */
export class NewsService extends SingletonService implements NewsServiceType {
  private static instance: NewsService;

  private constructor() {
    super();
  }

  static getInstance(): NewsService {
    return super.createInstance<NewsService>();
  }

  async getAll(prisma: PrismaClient, locale: string) {
    return await prisma.news.findMany({ 
      where: { locale } 
    });
  }

  async getById(prisma: PrismaClient, id: number, locale: string) {
    return await prisma.news.findUnique({ 
      where: {
        shared_id_locale: {
          shared_id: id,
          locale: locale
        }
      }
    });
  }

  async getByCode(prisma: PrismaClient, code: string, locale: string) {}
}

/**
 * Service for technical analysis
 */
export class TechnicalAnalyzerService extends SingletonService implements TechnicalAnalyzerServiceType {
  private static instance: TechnicalAnalyzerService;

  private constructor() {
    super();
  }

  static getInstance(): TechnicalAnalyzerService {
    return super.createInstance<TechnicalAnalyzerService>();
  }

  async getTechnicalAnalysis(prisma: PrismaClient, issuerId: number): Promise<TechnicalAnalysis | null> {
    const technicalAnalysis = await prisma.technical_analysis.findUnique({ 
      where: { issuer_id: issuerId }
    });

    if (!technicalAnalysis) {
      return null;
    }

    const oscillators = technicalAnalysis.oscillators as any;
    const movingAverages = technicalAnalysis.moving_averages as any;

    const defaultIndicator = {
      name: '',
      daily: 0,
      weekly: 0,
      monthly: 0,
      signal: 'hold' as const
    };

    return {
      oscillators: {
        cci: oscillators.cci || defaultIndicator,
        rsi: oscillators.rsi || defaultIndicator,
        macd: oscillators.macd || defaultIndicator,
        stochastic: oscillators.stochastic || defaultIndicator,
        williamsR: oscillators.williamsR || defaultIndicator
      },
      moving_averages: {
        ema: movingAverages.ema || defaultIndicator,
        sma: movingAverages.sma || defaultIndicator,
        wma: movingAverages.wma || defaultIndicator,
        dema: movingAverages.dema || defaultIndicator,
        wema: movingAverages.wema || defaultIndicator
      }
    };
  }
}

/**
 * Service for fundamental analysis
 */
export class FundamentalAnalyzerService extends SingletonService implements FundamentalAnalyzerServiceType {
  private static instance: FundamentalAnalyzerService;

  private constructor() {
    super();
  }

  static getInstance(): FundamentalAnalyzerService {
    return super.createInstance<FundamentalAnalyzerService>();
  }

  async getFundamentalAnalysis(prisma: PrismaClient, issuerId: number): Promise<FundamentalAnalysis | null> {
    const sentiments = await prisma.news_sentiment.findMany({ 
      where: { issuer_id: issuerId } 
    });

    if (sentiments.length === 0) {
      return null;
    }
  
    const avgSentiment = sentiments.reduce((acc, curr) => acc + curr.sentiment, 0) / sentiments.length;
  
    let recommendation = 'HOLD';
    if (avgSentiment > 0.3) recommendation = 'STRONG BUY';
    else if (avgSentiment > 0.1) recommendation = 'BUY';
    else if (avgSentiment < -0.3) recommendation = 'STRONG SELL';
    else if (avgSentiment < -0.1) recommendation = 'SELL';
  
    return {
      sentiment: Number(avgSentiment.toFixed(3)),
      recommendation,
      newsCount: sentiments.length,
      latestDate: sentiments[0]?.created_at || null
    };
  }
}

/**
 * Service for LSTM predictions
 */
export class LSTMAnalyzerService extends SingletonService implements LSTMAnalyzerServiceType {
  private static instance: LSTMAnalyzerService;

  private constructor() {
    super();
  }

  static getInstance(): LSTMAnalyzerService {
    return super.createInstance<LSTMAnalyzerService>();
  }

  async getLSTMAnalysis(prisma: PrismaClient, issuerId: number): Promise<LSTMPrediction[] | null> {
    const predictions = await prisma.lstm_predictions.findMany({ 
      where: { issuer_id: issuerId } 
    });

    return predictions.map(prediction => ({
      prediction_date: prediction.prediction_date.toISOString(),
      predicted_price: prediction.predicted_price
    }));
  }
}
