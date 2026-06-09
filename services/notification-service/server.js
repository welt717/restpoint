const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { safeMasterQuery } = require('../../shared/dist/dbConfig');
const { validateTenantActive } = require('../../shared/dist/tenancy');
const notificationsController = require('./controllers/notifications');

const app = express();
const PORT = process.env.PORT || 8111;

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
    // attach DB name if present
    if (tenantStatus.tenant && tenantStatus.tenant.db_name) {
      req.tenantDbName = tenantStatus.tenant.db_name;
    }
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'notification-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/restpoint/notification', async (req, res) => {
  res.json({
    success: true,
    message: 'Hello from notification-service!',
    tenant: req.tenantSlug
  });
});

// Notification REST endpoints
app.get('/api/v1/restpoint/notification/notifications', async (req, res) => {
  return notificationsController.getAllNotifications(req, res);
});

app.put('/api/v1/restpoint/notification/notifications/mark-all-read', async (req, res) => {
  return notificationsController.markAllNotificationsAsRead(req, res);
});

app.put('/api/v1/restpoint/notification/notifications/:id/read', async (req, res) => {
  return notificationsController.markNotificationAsRead(req, res);
});

app.delete('/api/v1/restpoint/notification/notifications/:id', async (req, res) => {
  return notificationsController.deleteNotification(req, res);
});

// Create notification endpoint (for real-time notifications from other services)
app.post('/api/v1/restpoint/notification/notifications', async (req, res) => {
  return notificationsController.createNotification(req, res);
});

// Subscribe endpoint placeholder (store subscription in tenant DB or push service)
app.post('/api/v1/restpoint/notification/subscribe', async (req, res) => {
  // In a full implementation we'd persist the subscription and send push messages
  console.log('Received push subscription (placeholder)');
  return res.status(200).json({ success: true, message: 'Subscribed (placeholder)' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`notification-service is running on port ${PORT}`);
  // Start background notification job for all tenants (runs every 60s)
  setInterval(async () => {
    try {
      const tenants = await safeMasterQuery(`SELECT tenant_slug, db_name FROM tenants WHERE status = 'active'`);
      for (const t of tenants) {
        if (t.db_name) {
          notificationsController.handleDeceasedNotifications(t.db_name, null);
        }
      }
    } catch (err) {
      console.error('Notification background job error:', err);
    }
  }, 60 * 1000);
});
