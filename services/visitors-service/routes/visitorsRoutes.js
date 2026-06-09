const express = require('express');
const router = express.Router();
const {
  registerVisitor,
  getRecentVisitors,
  getOnlineBookings,
  processBooking,
} = require('../controllers/visitorsControl');

router.post('/register-visitor', registerVisitor);
router.get('/recent-visitors', getRecentVisitors);
router.get('/online-bookings', getOnlineBookings);
router.post('/process-booking/:id', processBooking);

module.exports = router;
