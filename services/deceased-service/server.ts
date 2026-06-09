import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8103', 10);

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-csrf-token', 'x-tenant-slug'],
}));
app.use(helmet());
app.use(express.json());

// Tenant middleware - IMPORTANT: This should run before routes
app.use((req: Request, res: Response, next: NextFunction) => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || 'system_shared';
    (req as any).tenantSlug = tenantSlug;
    console.log(`[Deceased Service] Tenant: ${tenantSlug}`);
    next();
});

// Import routes
import deceasedRoutes from './routes/deceasedRoutes';
import autopsyRoutes from './routes/autopsyRoutes';
import chargesRoutes from './routes/chargesRoutes';
import chargeSettingsRoutes from './routes/chargeSettingsRoutes';

// Mount routes
app.use('/', deceasedRoutes);
app.use('/', autopsyRoutes);
app.use('/', chargesRoutes);
app.use('/', chargeSettingsRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        service: 'deceased-service',
        tenant: (req as any).tenantSlug,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong!'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Deceased service is running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
});

export default app;
