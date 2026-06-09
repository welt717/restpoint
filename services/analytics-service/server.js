const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { safeQuery } = require('../shared/dist/database');
const { validateTenantActive } = require('../shared/dist/tenancy');
const analyticsRoutes = require('./routes/analyticsRoutes');
const enhancedAnalyticsRoutes = require('./routes/enhancedAnalyticsRoutes');

const app = express();
const PORT = process.env.PORT || 8113;

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    service: 'analytics-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

// Legacy routes
app.use('/api/v1/restpoint', analyticsRoutes);

// Enhanced analytics routes
app.use('/api/v1/analytics', enhancedAnalyticsRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`analytics-service is running on port ${PORT}`);
});
