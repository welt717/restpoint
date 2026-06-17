/**
 * CORS Middleware
 * Provides CORS configuration for marketplace and other services
 */

const corsMiddleware = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:8082',
    'http://localhost:3000',
    'https://restpoint.co.ke',
    'https://www.restpoint.co.ke',
    process.env.FRONTEND_URL || 'http://localhost:8082'
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Tenant-Slug, X-Tenant-Db');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};

module.exports = corsMiddleware;