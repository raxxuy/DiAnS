import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from 'uuid';
import ServiceFactory from "./serviceFactory";
import { 
  CompanyServiceType, 
  FundamentalAnalyzerServiceType, 
  IssuerServiceType, 
  LSTMAnalyzerServiceType, 
  NewsServiceType, 
  StockServiceType, 
  TechnicalAnalyzerServiceType 
} from "./types";

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

// Add request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
  console.log(`[${req.headers['x-request-id']}] Request received for ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// Ignore favicon requests
app.get('/favicon.ico', (_req: Request, res: Response) => {
  res.status(204).end();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Get all issuers
app.get('/api/issuers', asyncHandler(async (req: Request, res: Response) => {
  const issuersService = ServiceFactory.getService('issuer') as IssuerServiceType;
  const issuers = await issuersService.getAll(prisma);
  res.json(issuers);
}));

// Get issuer by code
app.get('/api/issuers/:code', asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const issuersService = ServiceFactory.getService('issuer') as IssuerServiceType;
  const issuer = await issuersService.getByCode(prisma, code);
  res.json(issuer);
}));

// Get all companies
app.get('/api/companies', asyncHandler(async (req: Request, res: Response) => {
  const locale = req.query.locale as string;
  const companiesService = ServiceFactory.getService('company') as CompanyServiceType;
  const companies = await companiesService.getAll(prisma, locale);
  res.json(companies);
}));

// Get company by id
app.get('/api/companies/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const locale = req.query.locale as string;
  const companiesService = ServiceFactory.getService('company') as CompanyServiceType;
  const company = await companiesService.getById(prisma, parseInt(id), locale);
  res.json(company);
}));

// Get all stocks with issuer info
app.get('/api/stocks', asyncHandler(async (req: Request, res: Response) => {
  const stocksService = ServiceFactory.getService('stock') as StockServiceType;
  const stocks = await stocksService.getAll(prisma);
  res.json(stocks);
}));

// Get stocks by issuer id
app.get('/api/stocks/:issuerId', asyncHandler(async (req: Request, res: Response) => {
  const { issuerId } = req.params;
  const stocksService = ServiceFactory.getService('stock') as StockServiceType;
  const stocks = await stocksService.getByIssuerId(prisma, parseInt(issuerId));
  res.json(stocks);
}));

// Get all news
app.get('/api/news', asyncHandler(async (req: Request, res: Response) => {
  const locale = req.query.locale as string;
  const newsService = ServiceFactory.getService('news') as NewsServiceType;
  const news = await newsService.getAll(prisma, locale);
  res.json(news);
}));  

// Get news by id
app.get('/api/news/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const locale = req.query.locale as string;
  const newsService = ServiceFactory.getService('news') as NewsServiceType;
  const news = await newsService.getById(prisma, parseInt(id), locale);
  res.json(news);
}));

// Get technical analysis by issuer id
app.get('/api/analysis/technical', asyncHandler(async (req: Request, res: Response) => {
  const issuerId = req.query.issuer_id as string;
  const technicalAnalyzer = ServiceFactory.getService('technical') as TechnicalAnalyzerServiceType;
  const technicalAnalysis = await technicalAnalyzer.getTechnicalAnalysis(prisma, parseInt(issuerId));
  res.json(technicalAnalysis);
}));

// Get fundamental analysis by issuer id
app.get('/api/analysis/fundamental', asyncHandler(async (req: Request, res: Response) => {
  const issuerId = req.query.issuer_id as string;
  const fundamentalAnalyzer = ServiceFactory.getService('fundamental') as FundamentalAnalyzerServiceType;
  const fundamentalAnalysis = await fundamentalAnalyzer.getFundamentalAnalysis(prisma, parseInt(issuerId));
  res.json(fundamentalAnalysis);
}));

// Get LSTM analysis by issuer id
app.get('/api/analysis/lstm', asyncHandler(async (req: Request, res: Response) => {
  const issuerId = req.query.issuer_id as string;
  const lstmAnalyzer = ServiceFactory.getService('lstm') as LSTMAnalyzerServiceType;
  const lstmAnalysis = await lstmAnalyzer.getLSTMAnalysis(prisma, parseInt(issuerId));
  res.json(lstmAnalysis);
}));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: 'Something went wrong!' });
  console.error(err);
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});