const express = require('express');
const router = express.Router();
const {
  getMortuaryAnalytics,
  getComprehensiveVehicleAnalytics,
} = require('../controllers/analytics');

// Basic analytics endpoint
router.get('/analytics/mortuary-analytics', getMortuaryAnalytics);
router.get('/vehicle-analytics', getComprehensiveVehicleAnalytics);

module.exports = router;
