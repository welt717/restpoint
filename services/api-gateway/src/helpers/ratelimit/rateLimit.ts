import rateLimit from 'express-rate-limit';
import type { Options, RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';

// Redis client configuration
let redisClient: Redis | null = null;

// Initialize Redis client
const getRedisClient = (): Redis => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 attempts');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });
  }
  return redisClient;
};

// Interface for rate limiter options
interface IRateLimiterOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message?: string | object;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  requestWasSuccessful?: (req: Request, res: any) => boolean;
}

// Interface for rate limiter config
interface IRateLimiterConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message?: string | object;
}

// User payload from JWT
interface IUserPayload {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
}

// Extended Request interface with user property
declare global {
  namespace Express {
    interface Request {
      user?: IUserPayload;
    }
  }
}

/**
 * Creates a rate limiter middleware with Redis store
 * @param options - Rate limiter configuration options
 * @returns Express rate limiter middleware
 */
export const createRateLimiter = ({
  windowMs,
  max,
  keyGenerator,
  message,
  skipFailedRequests = false,
  skipSuccessfulRequests = false,
  requestWasSuccessful,
}: IRateLimiterOptions): RateLimitRequestHandler => {
  const redis = getRedisClient();
  
  const options: Options = {
    store: new RedisStore({
      sendCommand: async (...args: string[]): Promise<any> => {
        return await redis.call(...args as string[]);
      },
      prefix: 'rl:', // Rate limiting prefix for Redis keys
    }),
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipFailedRequests,
    skipSuccessfulRequests,
    message: message || {
      success: false,
      message: 'Too many requests, please try again later.',
    },
  };

  if (keyGenerator) {
    options.keyGenerator = keyGenerator;
  }

  if (requestWasSuccessful) {
    options.requestWasSuccessful = requestWasSuccessful;
  }

  return rateLimit(options);
};

/**
 * Generate a key based on user ID or IP address
 * @param req - Express request object
 * @returns Rate limit key string
 */
export const getUserBasedKey = (req: Request): string => {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Generate a key based on organization/tenant
 * @param req - Express request object
 * @returns Rate limit key with tenant prefix
 */
export const getTenantBasedKey = (req: Request): string => {
  const tenantSlug = (req.headers['x-tenant-slug'] as string) || 'system_shared';
  const userId = req.user?.id || 'anonymous';
  return `tenant:${tenantSlug}:user:${userId}`;
};

/**
 * Generate a key based on API endpoint
 * @param req - Express request object
 * @returns Rate limit key with endpoint path
 */
export const getEndpointBasedKey = (req: Request): string => {
  const endpoint = req.route?.path || req.path;
  return `${req.method}:${endpoint}:${req.ip}`;
};

// ============================================
// PREDEFINED RATE LIMITERS
// ============================================

/**
 * Global API rate limiter
 * Limits all requests to 100 per 15 minutes per IP
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  keyGenerator: (req: Request) => req.ip || req.socket.remoteAddress || 'unknown',
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * Strict limiter for sensitive endpoints
 * Limits sensitive routes to 50 requests per 15 minutes
 */
export const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Stricter limit
  keyGenerator: (req: Request) => req.ip || req.socket.remoteAddress || 'unknown',
  message: {
    success: false,
    message: 'Too many requests to sensitive endpoints. Please try again later.',
  },
});

/**
 * User-based rate limiter
 * Limits authenticated users to 60 requests per minute
 * Falls back to IP-based limiting for unauthenticated users
 */
export const userLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyGenerator: getUserBasedKey,
  message: {
    success: false,
    message: 'Rate limit exceeded. Please slow down.',
  },
});

/**
 * Authentication limiter (login, register, forgot password)
 * Stricter limits for auth endpoints - 10 attempts per 15 minutes
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 auth attempts
  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    return `auth:${email}:${req.ip}`;
  },
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

/**
 * API key based rate limiter
 * For external API consumers with API keys
 */
export const createApiKeyLimiter = (maxRequests: number = 1000, windowMinutes: number = 60) => {
  return createRateLimiter({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    keyGenerator: (req: Request) => {
      const apiKey = req.headers['x-api-key'] as string;
      return apiKey ? `apikey:${apiKey}` : req.ip || 'unknown';
    },
    message: {
      success: false,
      message: `API rate limit exceeded. Max ${maxRequests} requests per ${windowMinutes} minutes.`,
    },
  });
};

/**
 * Organization/Tenant based rate limiter
 * Limits per tenant across all users
 */
export const tenantLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute per tenant
  keyGenerator: (req: Request) => {
    const tenantSlug = (req.headers['x-tenant-slug'] as string) || 'system_shared';
    return `tenant:${tenantSlug}`;
  },
  message: {
    success: false,
    message: 'Organization rate limit exceeded. Please try again later.',
  },
});

/**
 * Search/Query rate limiter
 * Stricter limits for search endpoints that might be heavy
 */
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  keyGenerator: getUserBasedKey,
  message: {
    success: false,
    message: 'Too many search requests. Please wait a moment.',
  },
});

/**
 * Upload rate limiter
 * Limits file uploads to prevent abuse
 */
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  keyGenerator: getUserBasedKey,
  message: {
    success: false,
    message: 'Upload limit exceeded. Max 50 uploads per hour.',
  },
});

/**
 * Export/Download rate limiter
 * Limits data exports to prevent system overload
 */
export const exportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  keyGenerator: getUserBasedKey,
  message: {
    success: false,
    message: 'Export limit exceeded. Max 10 exports per hour.',
  },
});

// ============================================
// JWT VERIFICATION FUNCTION
// ============================================

/**
 * Verify JWT access token
 * @param token - JWT token string
 * @returns Decoded user payload or null if invalid
 */
export const verifyAccessToken = (token: string): IUserPayload | null => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'ballot-super-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET) as IUserPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Extract user from Authorization header
 * @param req - Express request object
 * @returns User payload or null
 */
export const extractUserFromRequest = (req: Request): IUserPayload | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyAccessToken(token);
};

// ============================================
// COMPOSITE RATE LIMITERS
// ============================================

/**
 * Apply multiple rate limiters in sequence
 * @param limiters - Array of rate limiter middleware functions
 * @returns Combined middleware
 */
export const applyLimiters = (...limiters: RateLimitRequestHandler[]): RateLimitRequestHandler => {
  return (req, res, next) => {
    let index = 0;
    
    const runNext = () => {
      if (index >= limiters.length) {
        next();
        return;
      }
      
      const limiter = limiters[index++];
      limiter(req, res, runNext);
    };
    
    runNext();
  };
};

/**
 * Combined limiter for authenticated API routes
 * Applies both user and tenant limits
 */
export const authenticatedApiLimiter = applyLimiters(userLimiter, tenantLimiter);

// Default export
export default {
  createRateLimiter,
  apiLimiter,
  strictLimiter,
  userLimiter,
  authLimiter,
  tenantLimiter,
  searchLimiter,
  uploadLimiter,
  exportLimiter,
  createApiKeyLimiter,
  verifyAccessToken,
  extractUserFromRequest,
  applyLimiters,
  authenticatedApiLimiter,
  getUserBasedKey,
  getTenantBasedKey,
  getEndpointBasedKey,
};