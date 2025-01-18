export default class CachingDecorator<T> {
  private cache: Map<string, any> = new Map();

  constructor(private service: T) {}

  async getAll(...args: any[]) {
    const key = `getAll-${JSON.stringify(args.slice(1))}`;
    if (!this.cache.has(key)) {
      const result = await (this.service as any).getAll(...args);
      this.cache.set(key, result);
    }
    return this.cache.get(key);
  }

  async getById(...args: any[]) {
    const key = `getById-${JSON.stringify(args.slice(1))}`;
    if (!this.cache.has(key)) {
      const result = await (this.service as any).getById(...args);
      this.cache.set(key, result);
    }
    return this.cache.get(key);
  }

  async getByCode(...args: any[]) {
    const key = `getByCode-${JSON.stringify(args.slice(1))}`;
    if (!this.cache.has(key)) {
      const result = await (this.service as any).getByCode(...args);
      this.cache.set(key, result);
    }
    return this.cache.get(key);
  }
}