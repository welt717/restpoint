import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import onboardingRoutes from './routes/onboardingRoutes';

dotenv.config();

// ============================================
// EXPRESS APP SETUP
// ============================================
const app: Application = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Serve uploaded files
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ============================================
// ROUTES
// ============================================
app.use('/api/onboarding', onboardingRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'tenant-service',
    timestamp: new Date().toISOString(),
    database: process.env.MASTER_DB_NAME || 'master_db'
  });
});

// Test endpoint
app.get('/test', (req: Request, res: Response) => {
  res.json({
    message: 'Tenant service is running!',
    endpoints: {
      register: 'POST /api/onboarding/organization',
      login: 'POST /api/onboarding/login',
      getOrg: 'GET /api/onboarding/organization',
      health: 'GET /health'
    },
    config: {
      dbHost: process.env.MASTER_DB_HOST || 'localhost',
      dbName: process.env.MASTER_DB_NAME || 'master_db'
    }
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`\n🚀 Tenant Service running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 Test: http://localhost:${PORT}/test`);
  console.log(`📍 Register: POST http://localhost:${PORT}/api/onboarding/organization`);
  console.log(`📍 Login: POST http://localhost:${PORT}/api/onboarding/login`);
  console.log(`\n📊 Database: ${process.env.MASTER_DB_NAME || 'master_db'}@${process.env.MASTER_DB_HOST || 'localhost'}`);
  console.log('✅ Ready to accept tenant registrations!\n');
});