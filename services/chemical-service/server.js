const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { safeQuery, safeExecute } = require('../../shared/dbConfig');
const { validateTenantActive } = require('../../shared/tenancy');
const chemicalRoutes = require('./routes/chemicalRoutes');

const app = express();
const PORT = process.env.PORT || 5105;

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-csrf-token', 'x-tenant-slug'],
}));
app.use(helmet());
app.use(express.json());

// Tenant Resolution Middleware
app.use(async (req, res, next) => {
  const tenantSlug = req.headers['x-tenant-slug'] || 'system_shared';
  req.tenantSlug = tenantSlug;

  if (tenantSlug !== 'system_shared') {
    const tenantStatus = await validateTenantActive(tenantSlug);
    if (!tenantStatus.active) {
      return res.status(403).json({ success: false, message: tenantStatus.reason });
    }
    req.tenant = tenantStatus.tenant;
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'chemical-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/restpoint/chemicals', chemicalRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[CHEMICAL ERROR] ${err.message}`);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 Chemical Service running on port ${PORT}`);
});

module.exports = app;