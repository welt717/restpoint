const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8104;

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-csrf-token', 'x-tenant-slug', 'x-tenant-id'],
}));

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Tenant Resolution Middleware
app.use((req, res, next) => {
  const tenantSlug = req.headers['x-tenant-slug'] || 'system_shared';
  req.tenantSlug = tenantSlug;
  req.tenantId = req.headers['x-tenant-id'];
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'calendar-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

// ===== CALENDAR ROUTES =====

// Get all events for tenant
app.get('/api/v1/restpoint/calendar/events', (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    res.json({
      success: true,
      message: 'Calendar events retrieved successfully',
      data: {
        events: [],
        filters: { startDate, endDate, type },
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create calendar event
app.post('/api/v1/restpoint/calendar/events', (req, res) => {
  try {
    const { title, description, startDate, endDate, type, location } = req.body;
    
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, startDate, endDate'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Calendar event created successfully',
      data: {
        id: Date.now(),
        title,
        description,
        startDate,
        endDate,
        type: type || 'funeral_service',
        location,
        tenant: req.tenantSlug,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get specific event
app.get('/api/v1/restpoint/calendar/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: 'Calendar event retrieved successfully',
      data: {
        id,
        title: 'Sample Event',
        description: 'Event description',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        type: 'funeral_service',
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update calendar event
app.put('/api/v1/restpoint/calendar/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, type, location } = req.body;
    
    res.json({
      success: true,
      message: 'Calendar event updated successfully',
      data: {
        id,
        title,
        description,
        startDate,
        endDate,
        type,
        location,
        tenant: req.tenantSlug,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete calendar event
app.delete('/api/v1/restpoint/calendar/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: 'Calendar event deleted successfully',
      data: {
        id,
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get calendar availability/slots
app.get('/api/v1/restpoint/calendar/availability', (req, res) => {
  try {
    const { date, serviceType } = req.query;
    
    res.json({
      success: true,
      message: 'Calendar availability retrieved',
      data: {
        date,
        serviceType,
        availableSlots: [
          { time: '09:00', available: true },
          { time: '10:00', available: true },
          { time: '11:00', available: false },
          { time: '14:00', available: true }
        ],
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get events by deceased
app.get('/api/v1/restpoint/calendar/deceased/:deceasedId', (req, res) => {
  try {
    const { deceasedId } = req.params;
    
    res.json({
      success: true,
      message: 'Events for deceased retrieved successfully',
      data: {
        deceasedId,
        events: [],
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Calendar Service running on http://0.0.0.0:${PORT}`);
  console.log(`📖 Health Check: http://localhost:${PORT}/health`);
  console.log(`📅 Calendar Events: http://localhost:${PORT}/api/v1/restpoint/calendar/events\n`);
});

module.exports = app;
