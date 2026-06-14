const express = require('express');
const router = express.Router();
const chemicalController = require('../controllers/chemicalController');
const usageController = require('../controllers/usageController');

// ============================================
// CHEMICAL INVENTORY ROUTES
// ============================================

// Get all chemicals (with low stock flag)
router.get('/', chemicalController.getAll);

// Get single chemical
router.get('/:id', chemicalController.getById);

// Create new chemical
router.post('/', chemicalController.create);

// Update chemical
router.put('/:id', chemicalController.update);

// Delete chemical (soft delete)
router.delete('/:id', chemicalController.remove);

// ============================================
// STOCK TRANSACTIONS
// ============================================

// Receive stock (add to inventory)
router.post('/:id/receive', chemicalController.receiveStock);

// Adjust stock (manual correction)
router.post('/:id/adjust', chemicalController.adjustStock);

// Get transaction history for a chemical
router.get('/:id/transactions', chemicalController.getTransactions);

// ============================================
// DECEASED CHEMICAL USAGE
// ============================================

// Record chemical usage on a deceased
router.post('/usage', usageController.recordUsage);

// Get all chemicals used on a specific deceased
router.get('/usage/deceased/:deceasedId', usageController.getByDeceased);

// Get all deceased that have used a specific chemical
router.get('/usage/chemical/:chemicalId', usageController.getDeceasedByChemical);

// Get full usage report (all deceased + chemicals used)
router.get('/usage/report', usageController.getUsageReport);

// ============================================
// DASHBOARD / REPORTS
// ============================================

// Dashboard summary (low stock, total usage, recent transactions)
router.get('/dashboard/summary', chemicalController.getDashboardSummary);

// Low stock alerts
router.get('/alerts/low-stock', chemicalController.getLowStockAlerts);

module.exports = router;