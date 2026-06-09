require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const { runMigrations } = require('./migrations/migrate');
const { errorHandler, corsOptions } = require('./middleware');
const portalRoutes = require('./routes/portal');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================

// CORS Configuration
app.use(cors(corsOptions));

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'LEE Funeral Home Portal Backend is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== API ROUTES ====================

// Main Portal Routes
app.use('/api/v1/restpoint/portal', portalRoutes);

// ==================== 404 HANDLER ====================

app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'Route not found'
  });
});

// ==================== ERROR HANDLER ====================

app.use(errorHandler);

// ==================== STARTUP ====================

const startServer = async () => {
  try {
    console.log('\n🚀 LEE Funeral Home Portal Backend Starting...\n');

    // Test Database Connection
    console.log('📊 Testing database connection...');
    await testConnection();

    // Run Migrations
    console.log('\n📋 Running database migrations...');
    await runMigrations();

    // Start Server
    app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}/api/v1/restpoint/portal`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('\n✗ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
