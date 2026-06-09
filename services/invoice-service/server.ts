const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { safeQuery } = require('../shared/database');
const { validateTenantActive } = require('../shared/tenancy');
const invoiceRoutes = require('./routes/invoiceRoutes');
const invoice = require('./routes/invoice');
const printInvoiceRoute = require('./routes/printInvoiceRoute');

const app = express();
const PORT = process.env.PORT || 8106;

// CORS configuration - Allow credentials for proxied requests
app.use(cors({
  origin: true, // Allow any origin (API gateway handles origin validation)
  credentials: true, // Allow credentials
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
    service: 'invoice-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/restpoint', invoiceRoutes);
app.use('/api/v1/restpoint', invoice);
app.use('/api/v1/restpoint', printInvoiceRoute);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`invoice-service is running on port ${PORT}`);
});
