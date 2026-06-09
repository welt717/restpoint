import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import calendarRoutes from './routes/calendarRoutes';
import { tenantMiddleware, errorHandler, requestLogger } from './middleware';
import { closeAllTenantConnections } from './database';

dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '8104', 10);

// ============================================
// MIDDLEWARE
// ============================================

// Security middleware
app.use(helmet());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-csrf-token', 'x-tenant-slug', 'x-tenant-id']
}));

// Request logging
app.use(requestLogger);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'calendar-service',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      tenantIsolation: true,
      eventManagement: true,
      availability: true,
      statistics: true
    }
  });
});

// ============================================
// TEST ENDPOINT
// ============================================

app.get('/test', (req: Request, res: Response) => {
  res.json({
    message: 'Calendar service is running!',
    endpoints: {
      calendar: 'GET /api/v1/calendar/events',
      events: {
        create: 'POST /api/v1/calendar/events',
        list: 'GET /api/v1/calendar/events',
        get: 'GET /api/v1/calendar/events/:id',
        update: 'PUT /api/v1/calendar/events/:id',
        delete: 'DELETE /api/v1/calendar/events/:id',
        byMonth: 'GET /api/v1/calendar/events/month/:year/:month',
        byDateRange: 'GET /api/v1/calendar/events/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD',
        upcoming: 'GET /api/v1/calendar/upcoming?limit=10',
        search: 'GET /api/v1/calendar/search?q=search_term'
      },
      availability: 'GET /api/v1/calendar/availability?date=YYYY-MM-DD',
      statistics: 'GET /api/v1/calendar/statistics',
      health: 'GET /health'
    },
    requiredHeaders: {
      'x-tenant-slug': 'Tenant identifier (required)',
      'x-tenant-id': 'Alternative tenant identifier (optional)'
    },
    exampleRequest: {
      headers: {
        'x-tenant-slug': 'my-tenant',
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Funeral Service',
        start: '2024-06-15T10:00:00',
        end: '2024-06-15T12:00:00',
        category: 'FUNERAL',
        priority: 'HIGH',
        location: 'Chapel Hall'
      }
    }
  });
});

// ============================================
// TENANT MIDDLEWARE & ROUTES
// ============================================

// Apply tenant middleware to all API routes
app.use('/api/v1/calendar', tenantMiddleware);

// Calendar routes
app.use('/api/v1/calendar', calendarRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'GET /test',
      'POST /api/v1/calendar/events',
      'GET /api/v1/calendar/events',
      'GET /api/v1/calendar/events/:id',
      'PUT /api/v1/calendar/events/:id',
      'DELETE /api/v1/calendar/events/:id'
    ]
  });
});

// ============================================
// ERROR HANDLER (Must be last)
// ============================================

app.use(errorHandler);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeAllTenantConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeAllTenantConnections();
  process.exit(0);
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           📅 CALENDAR SERVICE RUNNING                  ║
╚════════════════════════════════════════════════════════╝

✅ Service: Calendar Service v2.0.0
✅ Port: ${PORT}
✅ Address: http://0.0.0.0:${PORT}
✅ Database: Tenant-isolated MySQL
✅ Tenant Isolation: ENABLED
✅ Features:
   - Event Management (CRUD)
   - Availability Slots
   - Event Statistics
   - Search & Filtering
   - Soft Deletes
   - Audit Logging

📍 Endpoints:
   - Health: http://localhost:${PORT}/health
   - Test: http://localhost:${PORT}/test
   - Events: http://localhost:${PORT}/api/v1/calendar/events
   - Docs: http://localhost:${PORT}/test

📌 Required Header: x-tenant-slug
   Example: x-tenant-slug: my-mortuary

🚀 Ready to accept requests!
  `);
});

export default app;
