const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { safeQuery } = require('../../shared/dist/database');
const { validateTenantActive } = require('../../shared/dist/tenancy');

const app = express();
const PORT = process.env.PORT || 8110;

app.use(cors());
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
    service: 'visitors-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

const visitorsRoutes = require('./routes/visitorsRoutes');

app.use('/api/v1/restpoint/visitors', visitorsRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`visitors-service is running on port ${PORT}`);
});
