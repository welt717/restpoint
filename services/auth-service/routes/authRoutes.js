const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', protect, logout);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;