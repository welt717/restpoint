import IORedis from 'ioredis';
import type { Redis } from 'ioredis';

export class RedisCacheService {
  private client: Redis | null = null;
  private static instance: RedisCacheService;
  private isConnected = false;
  private connectionAttempted = false;

  private constructor() {
    this.initRedis();
  }

  public static getInstance(): RedisCacheService {
    if (!RedisCacheService.instance) {
      RedisCacheService.instance = new RedisCacheService();
    }
    return RedisCacheService.instance;
  }

  private initRedis(): void {
    // Skip Redis if explicitly disabled
    if (process.env.SKIP_REDIS === 'true' || process.env.REDIS_ENABLED === 'false') {
      console.log('Redis disabled by environment variable');
      this.client = null;
      this.isConnected = false;
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new IORedis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          if (times > 1) {
            // Stop retrying after first attempt
            this.connectionAttempted = true;
            this.isConnected = false;
            return null;
          }
          return 100;
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.connectionAttempted = true;
        console.log('Redis connected - caching enabled');
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.connectionAttempted = true;
        console.log('Redis connection closed - running without cache');
      });

      this.client.on('error', () => {
        // Silent fail - don't log repeated errors
        if (!this.connectionAttempted) {
          this.isConnected = false;
          this.connectionAttempted = true;
          console.log('Redis not available - running without cache');
        }
      });
    } catch (err) {
      console.log('Redis not available - running without cache');
      this.client = null;
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.client || !this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch {
      return false;
    }
  }
}

export default RedisCacheService;
