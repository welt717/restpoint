// RestPoint API Gateway - Pure JavaScript using require()
// No TypeScript compilation needed - runs directly with: node server.js
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');

dotenv.config();

const APP_NAME = 'restpoint-gateway';
const APP_VERSION = '1.0.0';

const Logger = {
  info: (message, meta) => console.log('[INFO] ' + message, meta || ''),
  error: (message, meta) => console.error('[ERROR] ' + message, meta || ''),
  warn: (message, meta) => console.warn('[WARN] ' + message, meta || ''),
  debug: (message, meta) => console.debug('[DEBUG] ' + message, meta || '')
};

// Error handlers
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', { message: error.message, stack: error.stack });
  const connectionErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
  if (!connectionErrors.includes(error.code)) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  Logger.error('Unhandled Rejection', { message: reason?.message || reason });
});

// Environment helper
const env = (key, fallback) => process.env[key] || fallback;

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Service URLs
const SVC = {
  auth: env('AUTH_SERVICE_URL', 'http://localhost:5001'),
  users: env('USERS_SERVICE_URL', 'http://localhost:5001'),
  marketplace: env('MARKETPLACE_SERVICE_URL', 'http://localhost:5004'),
  mpesa: env('MPESA_SERVICE_URL', 'http://localhost:5011'),
  portal: env('PORTAL_SERVICE_URL', 'http://localhost:5019'),
  tenant: env('TENANT_SERVICE_URL', 'http://localhost:5002'),
  deceased: env('DECEASED_SERVICE_URL', 'http://localhost:5003'),
  embalming: env('EMBALMING_SERVICE_URL', 'http://localhost:5105'),
  invoices: env('INVOICES_SERVICE_URL', 'http://localhost:5005'),
  coffin: env('COFFIN_SERVICE_URL', 'http://localhost:5006'),
  visitors: env('VISITORS_SERVICE_URL', 'http://localhost:5014'),
  notification: env('NOTIFICATION_SERVICE_URL', 'http://localhost:5111'),
  documents: env('DOCUMENTS_SERVICE_URL', 'http://localhost:5007'),
  analytics: env('ANALYTICS_SERVICE_URL', 'http://localhost:5009'),
  bodycheckout: env('BODYCHECKOUT_SERVICE_URL', 'http://localhost:5015'),
  edocuments: env('EDOCUMENTS_SERVICE_URL', 'http://localhost:5008'),
  calendar: env('CALENDAR_SERVICE_URL', 'http://localhost:5010'),
  chemicals: env('CHEMICAL_SERVICE_URL', 'http://localhost:5105'),
};

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env('NODE_ENV', 'development') === 'production' ? 10 : 100,
  message: { success: false, message: 'Too many auth attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost:')) return callback(null, true);
    const allowed = [
      'http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080',
      'https://restpoint.co.ke', 'https://app.restpoint.co.ke', 'https://api.restpoint.co.ke',
    ];
    if (allowed.indexOf(origin) >= 0) return callback(null, true);
    return callback(new Error('Origin not permitted: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'x-tenant-id'],
}));

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api/v1/', apiLimiter);

// Auth-specific rate limit
app.use((req, res, next) => {
  if (req.originalUrl.match(/\/auth\/(login|register|refresh)/)) {
    return authLimiter(req, res, next);
  }
  next();
});

// ============================================
// PROXY - Uses Node's native http module
// ============================================

function createProxy(targetUrl) {
  const parsedUrl = new URL(targetUrl);

  return (req, res) => {
    const path = req.originalUrl || req.url || '/';
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: path,
      method: req.method,
      headers: Object.assign({}, req.headers, { host: parsedUrl.host }),
    };

    // Remove connection header
    delete options.headers['connection'];

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      Logger.error('Proxy error: ' + targetUrl + ' - ' + err.message);
      if (!res.headersSent) {
        res.status(503).json({ success: false, message: 'Service unavailable', service: targetUrl });
      }
    });

    if (req.body && Object.keys(req.body).length > 0) {
      proxyReq.write(JSON.stringify(req.body));
    }

    proxyReq.end();
  };
}

// Register proxy routes
const proxyRoutes = [
  ['/api/v1/restpoint/auth', 'auth'],
  ['/api/v1/restpoint/users', 'users'],
  ['/api/v1/users', 'users'],
  ['/api/v1/restpoint/marketplace', 'marketplace'],
  ['/api/v1/marketplace', 'marketplace'],
  ['/api/v1/restpoint/mpesa', 'mpesa'],
  ['/api/v1/mpesa', 'mpesa'],
  ['/api/v1/restpoint/tenants', 'tenant'],
  ['/api/v1/restpoint/tenant', 'tenant'],
  ['/api/onboarding', 'tenant'],
  ['/api/v1/restpoint/system-admin', 'tenant'],
  ['/api/v1/restpoint/deceased', 'deceased'],
  ['/api/v1/restpoint/embalming', 'embalming'],
  ['/api/v1/restpoint/chemicals', 'chemicals'],
  ['/api/v1/restpoint/invoices', 'invoices'],
  ['/api/v1/restpoint/coffin', 'coffin'],
  ['/api/v1/restpoint/visitors', 'visitors'],
  ['/api/v1/restpoint/notification', 'notification'],
  ['/api/v1/restpoint/documents', 'documents'],
  ['/api/v1/restpoint/analytics', 'analytics'],
  ['/api/v1/restpoint/performance', 'analytics'],
  ['/api/v1/restpoint/bodycheckout', 'bodycheckout'],
  ['/api/v1/restpoint/portal', 'portal'],
  ['/api/v1/restpoint/calendar', 'calendar'],
  ['/api/v1/calendar', 'calendar'],
  ['/api/v1/restpoint/edocuments', 'edocuments'],
  ['/api/v1/edocuments', 'edocuments'],
];

proxyRoutes.forEach(([route, serviceKey]) => {
  app.use(route, createProxy(SVC[serviceKey]));
});

// Health
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now(), services: Object.keys(SVC) });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: APP_NAME, version: APP_VERSION, port: PORT });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Cannot ' + req.method + ' ' + req.originalUrl });
});

// Global error
app.use((err, req, res, next) => {
  Logger.error('Internal: ' + err.message, { stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  Logger.info(APP_NAME + ' running on http://' + HOST + ':' + PORT);
  Logger.info('Proxying ' + Object.keys(SVC).length + ' services');
});

const shutdown = () => {
  Logger.info('Shutting down...');
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;