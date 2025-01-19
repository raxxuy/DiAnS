/**
 * Base interface for services that can be cached
 */
interface BaseService {
  getAll(prisma: any, ...args: any[]): Promise<any>;
  getById(prisma: any, id: number, ...args: any[]): Promise<any>;
  getByCode(prisma: any, code: string, ...args: any[]): Promise<any>;
}

/**
 * Decorator that adds caching functionality to services.
 * Caches results of get* methods to improve performance.
 */
export default class CachingDecorator<T extends BaseService> {
  private cache: Map<string, any>;

  constructor(private readonly service: T) {
    this.cache = new Map();
  }

  /**
   * Get all items with caching
   * @param prisma - Prisma client instance
   * @param args - Additional arguments
   */
  async getAll(prisma: any, ...args: any[]): Promise<Awaited<ReturnType<T['getAll']>>> {
    const cacheKey = `getAll-${JSON.stringify(args)}`;
    
    if (!this.cache.has(cacheKey)) {
      const result = await this.service.getAll(prisma, ...args);
      this.cache.set(cacheKey, result);
    }
    
    return this.cache.get(cacheKey);
  }

  /**
   * Get item by ID with caching
   * @param prisma - Prisma client instance
   * @param id - Item ID
   * @param args - Additional arguments
   */
  async getById(prisma: any, id: number, ...args: any[]): Promise<Awaited<ReturnType<T['getById']>>> {
    const cacheKey = `getById-${id}-${JSON.stringify(args)}`;
    
    if (!this.cache.has(cacheKey)) {
      const result = await this.service.getById(prisma, id, ...args);
      this.cache.set(cacheKey, result);
    }
    
    return this.cache.get(cacheKey);
  }

  /**
   * Get item by code with caching
   * @param prisma - Prisma client instance
   * @param code - Item code
   * @param args - Additional arguments
   */
  async getByCode(prisma: any, code: string, ...args: any[]): Promise<Awaited<ReturnType<T['getByCode']>>> {
    const cacheKey = `getByCode-${code}-${JSON.stringify(args)}`;
    
    if (!this.cache.has(cacheKey)) {
      const result = await this.service.getByCode(prisma, code, ...args);
      this.cache.set(cacheKey, result);
    }
    
    return this.cache.get(cacheKey);
  }
}