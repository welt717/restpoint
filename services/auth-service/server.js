require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token']
}));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// HEALTH CHECK MUST COME BEFORE OTHER ROUTES
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'auth-service',
        timestamp: new Date().toISOString() 
    });
});

// Mount auth routes at the correct base path
// This ensures routes work when proxied from API gateway
app.use('/api/v1/restpoint/auth', authRoutes);

// Also support direct access without the full path for development
app.use(authRoutes);

// 404 handler - ONLY FOR ROUTES THAT WEREN'T MATCHED
app.use((req, res) => {
    console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.url} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Auth service running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Auth routes are ready`);
    console.log(`📍 Listening on: http://localhost:${PORT}\n`);
});