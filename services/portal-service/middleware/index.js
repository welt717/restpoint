const { AuthService } = require('../services');

// ==================== VERIFY TOKEN MIDDLEWARE ====================
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'fail',
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = AuthService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired token'
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Token verification failed'
    });
  }
};

// ==================== VERIFY MULTITENANT ISOLATION ====================
const verifyTenantAccess = (req, res, next) => {
  try {
    const deceasedIdParam = req.params.deceased_id;
    const deceasedIdToken = req.user?.deceased_id;

    if (!deceasedIdParam) {
      return res.status(400).json({
        status: 'fail',
        message: 'deceased_id parameter is required'
      });
    }

    if (deceasedIdParam !== deceasedIdToken) {
      return res.status(403).json({
        status: 'fail',
        message: 'Unauthorized: deceased_id mismatch. You can only access your own data.'
      });
    }

    next();
  } catch (error) {
    res.status(403).json({
      status: 'fail',
      message: 'Access verification failed'
    });
  }
};

// ==================== ERROR HANDLER MIDDLEWARE ====================
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation error',
      details: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Token has expired'
    });
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      status: 'fail',
      message: 'Duplicate entry error'
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      status: 'fail',
      message: err.message
    });
  }

  // Default error
  res.status(500).json({
    status: 'fail',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

// ==================== ASYNC HANDLER WRAPPER ====================
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== CORS CONFIGURATION ====================
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = {
  verifyToken,
  verifyTenantAccess,
  errorHandler,
  asyncHandler,
  corsOptions
};
