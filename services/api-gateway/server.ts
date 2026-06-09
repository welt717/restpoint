import dotenv from 'dotenv';
import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { apiReference } from '@scalar/express-api-reference';

dotenv.config();

// Logger interface
interface ILogger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

const Logger: ILogger = {
  info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
  debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta || '')
};

// Services mapping
interface IServices {
  users: string;
  marketplace: string;
  socketio: string;
  mpesa: string;
  portal: string;
  tenant: string;
  deceased: string;
  embalming: string;
  invoices: string;
  coldroom: string;
  coffin: string;
  hearse: string;
  visitors: string;
  notification: string;
  documents: string;
  analytics: string;
  reports: string;
  bodycheckout: string;
  edocuments: string;
  calendar: string;
  search: string;
}

// Error handlers
process.on('uncaughtException', (error: Error) => {
  Logger.error('Uncaught Exception', { message: error.message, stack: error.stack });
  const connectionErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
  if (!connectionErrors.includes((error as any).code)) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason: any) => {
  Logger.error('Unhandled Rejection', { message: reason?.message || reason });
});

// Configuration
const PORT: number = Number(process.env.PORT) || 8000;
const HOST: string = process.env.HOST || '0.0.0.0';

// Service URLs
const SERVICES: IServices = {
  users: process.env.USERS_SERVICE_URL || 'http://localhost:8003',
  marketplace: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:8007',
  socketio: process.env.SOCKETIO_SERVICE_URL || 'http://localhost:8009',
  mpesa: process.env.MPESA_SERVICE_URL || 'http://localhost:8011',
  portal: process.env.PORTAL_SERVICE_URL || 'http://localhost:8003',
  tenant: process.env.TENANT_SERVICE_URL || 'http://localhost:8002',
  deceased: process.env.DECEASED_SERVICE_URL || 'http://localhost:8103',
  embalming: process.env.EMBALMING_SERVICE_URL || 'http://localhost:8105',
  invoices: process.env.INVOICES_SERVICE_URL || 'http://localhost:8106',
  coldroom: process.env.COLDROOM_SERVICE_URL || 'http://localhost:8107',
  coffin: process.env.COFFIN_SERVICE_URL || 'http://localhost:8108',
  hearse: process.env.HEARSE_SERVICE_URL || 'http://localhost:8109',
  visitors: process.env.VISITORS_SERVICE_URL || 'http://localhost:8110',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8111',
  documents: process.env.DOCUMENTS_SERVICE_URL || 'http://localhost:8112',
  edocuments: process.env.EDOCUMENTS_SERVICE_URL || 'http://localhost:8116',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8113',
  reports: process.env.REPORTS_SERVICE_URL || 'http://localhost:8114',
  bodycheckout: process.env.BODYCHECKOUT_SERVICE_URL || 'http://localhost:8115',
  calendar: process.env.CALENDAR_SERVICE_URL || 'http://localhost:8104',
  search: process.env.SEARCH_SERVICE_URL || 'http://localhost:8020',
};

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

// Initialize Express app
const app: Express = express();

// CORS configuration
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:8080',
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error(`CORS: origin ${origin} not permitted`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-csrf-token', 'x-tenant-slug'],
}));

// Helmet security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Body parser middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiters
app.use('/api/v1/', apiLimiter);

// Auth-specific rate limiter
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl.match(/\/auth\/(login|register|refresh)/)) {
    return authLimiter(req, res, next);
  }
  next();
});

// ============================================
// SIMPLE FETCH-BASED PROXY FUNCTION
// ============================================
const createProxy = (targetUrl: string, serviceName: string) => {
  return async (req: Request, res: Response) => {
    try {
      // Build the full URL - use req.originalUrl to preserve the original path
      // and avoid duplicating query parameters
      let url = `${targetUrl}${req.originalUrl}`;
      
      Logger.debug(`[${serviceName} PROXY] ${req.method} ${req.url} → ${url}`);
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Forward important headers
      if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization as string;
      }
      if (req.headers.cookie) {
        headers['Cookie'] = req.headers.cookie as string;
      }
      if (req.headers['x-tenant-slug']) {
        headers['x-tenant-slug'] = req.headers['x-tenant-slug'] as string;
      }
      if (req.headers['x-tenant-id']) {
        headers['x-tenant-id'] = req.headers['x-tenant-id'] as string;
      }
      
      // Prepare request options
      const options: RequestInit = {
        method: req.method,
        headers,
      };
      
      // Add body for non-GET/HEAD requests
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        options.body = JSON.stringify(req.body);
      }
      
      // Make the request
      const response = await fetch(url, options);
      const data = await response.json();
      
      // Forward the response
      res.status(response.status).json(data);
    } catch (error: any) {
      Logger.error(`[${serviceName} PROXY ERROR] ${req.method} ${req.url}: ${error.message}`);
      if (!res.headersSent) {
        res.status(503).json({ 
          success: false, 
          message: `${serviceName} service temporarily unavailable`,
          error: error.message 
        });
      }
    }
  };
};

// ============================================
// AUTH SERVICE (Port 8001)
// ============================================
app.use('/api/v1/restpoint/auth', createProxy('http://localhost:8001', 'AUTH'));

// ============================================
// USERS SERVICE (Port 8003)
// ============================================
app.use('/api/v1/restpoint/users', createProxy(SERVICES.users, 'USERS'));
app.use('/api/v1/users', createProxy(SERVICES.users, 'USERS'));
app.use('/uploads/users', createProxy(SERVICES.users, 'USERS'));

// ============================================
// MARKETPLACE SERVICE (Port 8007)
// ============================================
app.use('/api/v1/restpoint/marketplace', createProxy(SERVICES.marketplace, 'MARKETPLACE'));
app.use('/api/v1/marketplace', createProxy(SERVICES.marketplace, 'MARKETPLACE'));

// ============================================
// MPESA SERVICE (Port 8011)
// ============================================
app.use('/api/v1/restpoint/mpesa', createProxy(SERVICES.mpesa, 'MPESA'));
app.use('/api/v1/mpesa', createProxy(SERVICES.mpesa, 'MPESA'));

// ============================================
// TENANT SERVICE (Port 8002)
// ============================================
app.use('/api/v1/restpoint/tenants', createProxy(SERVICES.tenant, 'TENANT'));
app.use('/api/v1/restpoint/tenant', createProxy(SERVICES.tenant, 'TENANT'));
app.use('/api/onboarding', createProxy(SERVICES.tenant, 'TENANT'));

// ============================================
// DECEASED SERVICE (Port 8103)
// ============================================
app.use('/api/v1/restpoint/deceased', createProxy(SERVICES.deceased, 'DECEASED'));

// ============================================
// EMBALMING SERVICE (Port 8105)
// ============================================
app.use('/api/v1/restpoint/embalming', createProxy(SERVICES.embalming, 'EMBALMING'));
app.use('/api/v1/restpoint/chemicals', createProxy(SERVICES.embalming, 'EMBALMING'));

// ============================================
// INVOICES SERVICE (Port 8106)
// ============================================
app.use('/api/v1/restpoint/invoices', createProxy(SERVICES.invoices, 'INVOICES'));

// ============================================
// COLDROOM SERVICE (Port 8107)
// ============================================
app.use('/api/v1/restpoint/coldroom', createProxy(SERVICES.coldroom, 'COLDROOM'));

// ============================================
// COFFIN SERVICE (Port 8108)
// ============================================
app.use('/api/v1/restpoint/coffin', createProxy(SERVICES.coffin, 'COFFIN'));
app.use('/api/v1/restpoint/register-coffin', createProxy(SERVICES.coffin, 'COFFIN'));

// ============================================
// HEARSE SERVICE (Port 8109)
// ============================================
app.use('/api/v1/restpoint/hearse', createProxy(SERVICES.hearse, 'HEARSE'));

// ============================================
// VISITORS SERVICE (Port 8110)
// ============================================
app.use('/api/v1/restpoint/visitors', createProxy(SERVICES.visitors, 'VISITORS'));

// ============================================
// NOTIFICATION SERVICE (Port 8111)
// ============================================
app.use('/api/v1/restpoint/notification', createProxy(SERVICES.notification, 'NOTIFICATION'));

// ============================================
// DOCUMENTS SERVICE (Port 8112)
// ============================================
app.use('/api/v1/restpoint/documents', createProxy(SERVICES.documents, 'DOCUMENTS'));

// ============================================
// ANALYTICS SERVICE (Port 8113)
// ============================================
app.use('/api/v1/restpoint/analytics', createProxy(SERVICES.analytics, 'ANALYTICS'));
app.use('/api/v1/restpoint/performance', createProxy(SERVICES.analytics, 'ANALYTICS'));
app.use('/api/v1/restpoint/mortuary-analytics', createProxy(SERVICES.analytics, 'ANALYTICS'));

// ============================================
// REPORTS SERVICE (Port 8114)
// ============================================
app.use('/api/v1/restpoint/reports', createProxy(SERVICES.reports, 'REPORTS'));

// ============================================
// BODY CHECKOUT SERVICE (Port 8115)
// ============================================
app.use('/api/v1/restpoint/bodycheckout', createProxy(SERVICES.bodycheckout, 'BODYCHECKOUT'));

// ============================================
// SEARCH SERVICE (Port 8020)
// ============================================
app.use('/api/v1/search', createProxy(SERVICES.search, 'SEARCH'));

// ============================================
// PORTAL SERVICE (Port 8003)
// ============================================
app.use('/api/v1/restpoint/portal', createProxy(SERVICES.portal, 'PORTAL'));

// ============================================
// CALENDAR SERVICE (Port 8104)
// ============================================
app.use('/api/v1/restpoint/calendar', createProxy(SERVICES.calendar, 'CALENDAR'));
app.use('/api/v1/calendar', createProxy(SERVICES.calendar, 'CALENDAR'));

// ============================================
// EDOCUMENTS SERVICE (Port 8116)
// ============================================
app.use('/api/v1/restpoint/edocuments', createProxy(SERVICES.edocuments, 'EDOCUMENTS'));
app.use('/api/v1/edocuments', createProxy(SERVICES.edocuments, 'EDOCUMENTS'));

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(), 
    timestamp: Date.now(),
    services: Object.keys(SERVICES)
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', service: 'api-gateway', port: PORT, timestamp: new Date().toISOString() });
});

// ============================================
// API REFERENCE DOCUMENTATION
// ============================================
app.use(
  '/reference',
  apiReference({
    spec: {
      content: {
        openapi: '3.1.0',
        info: { 
          title: 'API Gateway - RestPoint MMS', 
          version: '1.0.0',
          description: 'Unified API Gateway for RestPoint Mortuary Management System'
        },
        servers: [{ url: `http://localhost:${PORT}`, description: 'Local development' }],
      }
    }
  })
);

// ============================================
// 404 HANDLER
// ============================================
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    message: `Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  Logger.error(`Internal Server Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message 
  });
});

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, HOST, () => {
  Logger.info(`🚀 API Gateway running on http://${HOST}:${PORT}`);
  console.log('\n📋 Service Mapping:');
  console.log('═'.repeat(50));
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`   ✅ ${name.padEnd(15)} → ${url}`);
  });
  console.log('═'.repeat(50));
  console.log(`\n📖 API Reference: http://localhost:${PORT}/reference`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`🔑 Auth endpoint: http://localhost:${PORT}/api/v1/restpoint/auth`);
  console.log(`⚰️  Deceased endpoint: http://localhost:${PORT}/api/v1/restpoint/deceased\n`);
});

// Graceful shutdown
const shutdown = () => {
  Logger.info('Shutting down API Gateway...');
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
