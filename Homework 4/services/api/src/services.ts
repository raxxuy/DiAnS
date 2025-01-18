import { PrismaClient } from "@prisma/client";
import {
  IssuerServiceType,
  CompanyServiceType,
  StockServiceType,
  NewsServiceType,
  TechnicalAnalyzerServiceType,
  FundamentalAnalyzerServiceType,
  LSTMAnalyzerServiceType,
  TechnicalAnalysis
} from "./types";

export class IssuerService implements IssuerServiceType {
  private static instance: IssuerService;

  private constructor() {}

  static getInstance() {
    if (!IssuerService.instance) {
      IssuerService.instance = new IssuerService();
    }
    return IssuerService.instance;
  }

  async getAll(prisma: PrismaClient) {
    return await prisma.issuer.findMany();
  }

  async getByCode(prisma: PrismaClient, code: string) {
    return await prisma.issuer.findUnique({ where: { code } });
  }
}

export class CompanyService implements CompanyServiceType {
  private static instance: CompanyService;

  private constructor() {}

  static getInstance() {
    if (!CompanyService.instance) {
      CompanyService.instance = new CompanyService();
    }
    return CompanyService.instance;
  }

  async getAll(prisma: PrismaClient, locale: string) {
    return locale === "en" ? await prisma.company.findMany() : await prisma.company_mk.findMany();
  }

  async getById(prisma: PrismaClient, id: number, locale: string) {
    return locale === "en" ? await prisma.company.findUnique({ where: { id: id } }) : await prisma.company_mk.findUnique({ where: { id: id } });
  }
}

export class StockService implements StockServiceType {
  private static instance: StockService;

  private constructor() {}

  static getInstance() {
    if (!StockService.instance) {
      StockService.instance = new StockService();
    }
    return StockService.instance;
  }

  async getAll(prisma: PrismaClient) {
    return await prisma.stockhistory.findMany({ include: { issuer: true } });
  }

  async getByIssuerId(prisma: PrismaClient, issuerId: number) {
    return await prisma.stockhistory.findMany({
      where: { issuer_id: issuerId },
      orderBy: { date: 'desc' }
    });
  }
}

export class NewsService implements NewsServiceType {
  private static instance: NewsService;

  private constructor() {}

  static getInstance() {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  async getAll(prisma: PrismaClient, locale: string) {
    return await prisma.news.findMany({ where: { locale: locale } });
  }

  async getById(prisma: PrismaClient, id: number, locale: string) {
    return await prisma.news.findUnique({ where: {
      shared_id_locale: {
        shared_id: id,
        locale: locale
      }
    }});
  }
}

export class TechnicalAnalyzerService implements TechnicalAnalyzerServiceType {
  private static instance: TechnicalAnalyzerService;

  private constructor() {}

  static getInstance() {
    if (!TechnicalAnalyzerService.instance) {
      TechnicalAnalyzerService.instance = new TechnicalAnalyzerService();
    }
    return TechnicalAnalyzerService.instance;
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

export class FundamentalAnalyzerService implements FundamentalAnalyzerServiceType {
  private static instance: FundamentalAnalyzerService;

  private constructor() {}

  static getInstance() {
    if (!FundamentalAnalyzerService.instance) {
      FundamentalAnalyzerService.instance = new FundamentalAnalyzerService();
    }
    return FundamentalAnalyzerService.instance;
  }

  async getFundamentalAnalysis(prisma: PrismaClient, issuerId: number) {
    const sentiments = await prisma.news_sentiment.findMany({ where: { issuer_id: issuerId } });

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

export class LSTMAnalyzerService implements LSTMAnalyzerServiceType {
  private static instance: LSTMAnalyzerService;

  private constructor() {}

  static getInstance() {
    if (!LSTMAnalyzerService.instance) {
      LSTMAnalyzerService.instance = new LSTMAnalyzerService();
    }
    return LSTMAnalyzerService.instance;
  }

  async getLSTMAnalysis(prisma: PrismaClient, issuerId: number) {
    const predictions = await prisma.lstm_predictions.findMany({ where: { issuer_id: issuerId } });

    return predictions.map(prediction => ({
      prediction_date: prediction.prediction_date.toISOString(),
      predicted_price: prediction.predicted_price
    }));
  }
}
