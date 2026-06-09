const express = require('express');
const router = express.Router();
const enhancedAnalyticsController = require('../controllers/enhancedAnalytics');

// Dashboard endpoints
router.get('/dashboard', enhancedAnalyticsController.getDashboard);
router.get('/monthly', enhancedAnalyticsController.getMonthlyAnalytics);
router.get('/yearly', enhancedAnalyticsController.getYearlyAnalytics);

// Report endpoints
router.get('/report', enhancedAnalyticsController.getComprehensiveReport);
router.post('/report/save', enhancedAnalyticsController.saveReport);
router.get('/reports', enhancedAnalyticsController.getSavedReports);

// Export endpoints
router.post('/export/pdf', enhancedAnalyticsController.exportPDF);
router.post('/export/excel', enhancedAnalyticsController.exportExcel);
router.post('/export/csv', enhancedAnalyticsController.exportCSV);

module.exports = router;
