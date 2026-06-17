/**
 * Global module shim for services expecting ../../global/index
 * Provides shared middleware and utilities
 */
let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (err) {
  console.warn('⚠️ [global] jsonwebtoken not available, authentication will be passthrough');
  jwt = null;
}

const authenticate = (req, res, next) => {
  if (!jwt) {
    console.warn('⚠️ [global] jwt unavailable, skipping auth');
    return next();
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = { authenticate, errorHandler };