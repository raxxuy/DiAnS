import { 
  IssuerService, 
  CompanyService, 
  StockService, 
  NewsService, 
  TechnicalAnalyzerService, 
  FundamentalAnalyzerService, 
  LSTMAnalyzerService 
} from "./services";
import CachingDecorator from "./cachingDecorator";

export default class ServiceFactory {
  private static instances: Record<string, any> = {};

  static getService<T>(serviceType: string): T {
    if (!this.instances[serviceType]) {
      switch (serviceType) {
        case "issuer":
          this.instances[serviceType] = new CachingDecorator(IssuerService.getInstance());
          break;
        case "company":
          this.instances[serviceType] = new CachingDecorator(CompanyService.getInstance());
          break;
        case "stock":
          this.instances[serviceType] = StockService.getInstance();
          break;
        case "news":
          this.instances[serviceType] = new CachingDecorator(NewsService.getInstance());
          break;
        case "technical":
          this.instances[serviceType] = TechnicalAnalyzerService.getInstance();
          break;
        case "fundamental":
          this.instances[serviceType] = FundamentalAnalyzerService.getInstance();
          break;
        case "lstm":
          this.instances[serviceType] = LSTMAnalyzerService.getInstance();
          break;
        default:
          throw new Error("Invalid service type");
      }
    }
    return this.instances[serviceType];
  }
}