#!/usr/bin/env node
// RestPoint API Gateway — Pure Node.js (no TypeScript compilation needed)
// Run directly: node server.js

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
  info: (m, d) => { if (d) console.log('[INFO] ' + m, d); else console.log('[INFO] ' + m); },
  error: (m, d) => { if (d) console.error('[ERROR] ' + m, d); else console.error('[ERROR] ' + m); },
  warn: (m, d) => { if (d) console.warn('[WARN] ' + m, d); else console.warn('[WARN] ' + m); },
  debug: (m, d) => { if (d) console.debug('[DEBUG] ' + m, d); else console.debug('[DEBUG] ' + m); },
};

process.on('uncaughtException', function(e) {
  Logger.error('Uncaught Exception', { message: e.message, stack: e.stack });
  if ([ 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET' ].indexOf(e.code) < 0) {
    process.exit(1);
  }
});

process.on('unhandledRejection', function(r) {
  Logger.error('Unhandled Rejection', { message: (r && r.message) || r });
});

function env(key, fallback) {
  var val = process.env[key];
  return val || fallback;
}

var PORT = Number(process.env.PORT) || 5000;
var HOST = process.env.HOST || '0.0.0.0';

var SVC = {};
SVC.auth = env('AUTH_SERVICE_URL', 'http://localhost:5001');
SVC.users = env('USERS_SERVICE_URL', 'http://localhost:5001');
SVC.marketplace = env('MARKETPLACE_SERVICE_URL', 'http://localhost:5004');
SVC.mpesa = env('MPESA_SERVICE_URL', 'http://localhost:5011');
SVC.portal = env('PORTAL_SERVICE_URL', 'http://localhost:5019');
SVC.tenant = env('TENANT_SERVICE_URL', 'http://localhost:5002');
SVC.deceased = env('DECEASED_SERVICE_URL', 'http://localhost:5003');
SVC.embalming = env('EMBALMING_SERVICE_URL', 'http://localhost:5105');
SVC.invoices = env('INVOICES_SERVICE_URL', 'http://localhost:5005');
SVC.coffin = env('COFFIN_SERVICE_URL', 'http://localhost:5006');
SVC.visitors = env('VISITORS_SERVICE_URL', 'http://localhost:5014');
SVC.notification = env('NOTIFICATION_SERVICE_URL', 'http://localhost:5111');
SVC.documents = env('DOCUMENTS_SERVICE_URL', 'http://localhost:5007');
SVC.analytics = env('ANALYTICS_SERVICE_URL', 'http://localhost:5009');
SVC.bodycheckout = env('BODYCHECKOUT_SERVICE_URL', 'http://localhost:5015');
SVC.edocuments = env('EDOCUMENTS_SERVICE_URL', 'http://localhost:5008');
SVC.calendar = env('CALENDAR_SERVICE_URL', 'http://localhost:5010');
SVC.chemicals = env('CHEMICAL_SERVICE_URL', 'http://localhost:5105');

var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

var isProd = env('NODE_ENV', 'development') === 'production';
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  message: { success: false, message: 'Too many auth attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

var app = express();

app.use(cors({
  origin: function(origin, cb) {
    if (!origin || origin.indexOf('localhost') >= 0) return cb(null, true);
    var allowed = [
      'https://restpoint.co.ke',
      'https://app.restpoint.co.ke',
      'https://api.restpoint.co.ke',
    ];
    if (allowed.indexOf(origin) >= 0) return cb(null, true);
    return cb(new Error('Origin not allowed: ' + origin));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-tenant-slug','x-tenant-id'],
}));

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api/v1/', apiLimiter);

app.use(function(req, res, next) {
  if (req.originalUrl.match(/\/auth\/(login|register|refresh)/)) {
    return authLimiter(req, res, next);
  }
  next();
});

// ===== PROXY =====
function createProxy(target) {
  var parts = new URL(target);
  return function(req, res) {
    var path = req.originalUrl || req.url || '/';
    var opts = {
      hostname: parts.hostname,
      port: parts.port,
      path: path,
      method: req.method,
      headers: Object.assign({}, req.headers, { host: parts.host }),
    };
    delete opts.headers['connection'];

    var proxy = http.request(opts, function(proxyRes) {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxy.on('error', function(err) {
      Logger.error('Proxy error: ' + target + ' - ' + err.message);
      if (!res.headersSent) {
        res.status(503).json({ success: false, message: 'Service unavailable' });
      }
    });

    if (req.body && Object.keys(req.body).length > 0) {
      proxy.write(JSON.stringify(req.body));
    }
    proxy.end();
  };
}

// Route config: [path, serviceKey]
var routes = [
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

for (var i = 0; i < routes.length; i++) {
  app.use(routes[i][0], createProxy(SVC[routes[i][1]]));
}

// Health
app.get('/api/v1/health', function(req, res) {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now(), services: Object.keys(SVC) });
});

app.get('/health', function(req, res) {
  res.json({ status: 'ok', service: APP_NAME, version: APP_VERSION, port: PORT });
});

// 404
app.use(function(req, res) {
  res.status(404).json({ success: false, message: 'Cannot ' + req.method + ' ' + req.originalUrl });
});

// Error handler
app.use(function(err, req, res, next) {
  Logger.error('Internal: ' + err.message, { stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start
var server = app.listen(PORT, HOST, function() {
  Logger.info(APP_NAME + ' running on http://' + HOST + ':' + PORT);
  Logger.info('Proxying ' + Object.keys(SVC).length + ' services');
});

function shutdown() {
  Logger.info('Shutting down...');
  server.close(function() { process.exit(0); });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;