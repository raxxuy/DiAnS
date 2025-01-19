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
import { 
  ServiceType, 
  BaseService,
  CacheableService
} from "./types";

/**
 * Factory for creating and managing service instances.
 * Handles caching and singleton pattern for services.
 */
export default class ServiceFactory {
  private static instances: Map<ServiceType, BaseService> = new Map();

  /**
   * Get or create a service instance of the specified type
   * @param serviceType - Type of service to get
   * @returns Service instance with appropriate type
   */
  static getService<T extends BaseService>(serviceType: ServiceType): T {
    if (!this.instances.has(serviceType)) {
      const service = this.createService(serviceType);
      this.instances.set(serviceType, service);
    }
    
    return this.instances.get(serviceType) as T;
  }

  /**
   * Create a new service instance
   * @param serviceType - Type of service to create
   * @returns New service instance
   */
  private static createService(serviceType: ServiceType): BaseService {
    let service: BaseService;

    switch (serviceType) {
      case 'issuer':
        service = new CachingDecorator(IssuerService.getInstance());
        break;
      case 'company':
        service = new CachingDecorator(CompanyService.getInstance());
        break;
      case 'stock':
        service = StockService.getInstance();
        break;
      case 'news':
        service = new CachingDecorator(NewsService.getInstance());
        break;
      case 'technical':
        service = TechnicalAnalyzerService.getInstance();
        break;
      case 'fundamental':
        service = FundamentalAnalyzerService.getInstance();
        break;
      case 'lstm':
        service = LSTMAnalyzerService.getInstance();
        break;
      default:
        throw new Error(`Invalid service type: ${serviceType}`);
    }

    return service;
  }
}