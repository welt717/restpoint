import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { safeQuery, safeExecute } from '../../shared/dbConfig';
import { validateTenantActive } from '../../shared/tenancy';
import chemicalRoutes from './routes/chemicalRoutes';

const app = express();
const PORT = process.env.PORT || 5105;

declare module 'express-serve-static-core' {
  interface Request {
    tenantSlug?: string;
    tenant?: any;
  }
}

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
app.use(async (req: Request, res: Response, next: NextFunction) => {
  const tenantSlug = req.headers['x-tenant-slug'] as string || 'system_shared';
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
app.get('/health', (req: Request, res: Response) => {
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
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[CHEMICAL ERROR] ${err.message}`);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
  console.log(`🧪 Chemical Service running on port ${PORT}`);
});

export default app;