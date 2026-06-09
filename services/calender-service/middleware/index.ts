import { Request, Response, NextFunction } from 'express';

/**
 * Extend Express Request to include tenant information
 */
declare global {
  namespace Express {
    interface Request {
      tenantSlug?: string;
      tenantId?: string;
    }
  }
}

/**
 * Middleware to extract tenant information from headers
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const tenantSlug = req.headers['x-tenant-slug'] as string;
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantSlug && !tenantId) {
    res.status(400).json({
      success: false,
      message: 'Tenant information missing. Please provide x-tenant-slug or x-tenant-id header.'
    });
    return;
  }

  req.tenantSlug = tenantSlug || tenantId || 'default';
  req.tenantId = tenantId;

  console.log(`📍 Request from tenant: ${req.tenantSlug}`);

  next();
};

/**
 * Middleware for error handling
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(`❌ Error in ${req.method} ${req.path}:`, err.message);

  // Database connection errors
  if (err.message.includes('connect ECONNREFUSED')) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed. Please ensure your tenant database is running.'
    });
    return;
  }

  // Database table doesn't exist
  if (err.message.includes('ER_NO_SUCH_TABLE')) {
    res.status(500).json({
      success: false,
      message: 'Calendar table not found in tenant database. Please run migrations.'
    });
    return;
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
};

/**
 * Middleware for request logging
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

export default {
  tenantMiddleware,
  errorHandler,
  requestLogger
};
