import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { authenticate } = require('../../../global/index');

import {
  stkPushRequest,
  handleCallback,
  queryTransactionStatus,
  getTransactionHistory,
  getTransactionSummary,
  getTransaction,
  updateTransaction
} from '../controllers/mpesa.controller.js';

const router = express.Router();

/**
 * Middleware: Allow internal service calls or require authentication
 */
const internalOrAuth = (req, res, next) => {
  const internalSecret = req.headers['x-internal-secret'] || req.headers['X-Internal-Secret'];
  const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || 'siasahub_internal_secret_2026';
  
  if (internalSecret && internalSecret === expectedSecret) {
    req.user = { userId: req.body.userId || 'INTERNAL', role: 'service' };
    return next();
  }
  return authenticate(req, res, next);
};

// ============================================
// STK PUSH - Initiate Payment
// ============================================

/**
 * POST /api/v1/mpesa/stkpush
 * Initiate STK Push payment for a tenant
 * Body: { tenantId, phoneNumber, amount, type, reference, description }
 */
router.post('/stkpush', internalOrAuth, stkPushRequest);

// ============================================
// TRANSACTION HISTORY - Tenant Payment Records
// ============================================

/**
 * GET /api/v1/mpesa/tenants/:tenantId/transactions
 * Get paginated transaction history for a tenant
 * Query: ?page=1&limit=20&status=completed&startDate=2024-01-01&endDate=2024-12-31&phoneNumber=0712345678
 */
router.get('/tenants/:tenantId/transactions', internalOrAuth, getTransactionHistory);

/**
 * GET /api/v1/mpesa/tenants/:tenantId/transactions/:transactionId
 * Get single transaction details
 */
router.get('/tenants/:tenantId/transactions/:transactionId', internalOrAuth, getTransaction);

/**
 * GET /api/v1/mpesa/tenants/:tenantId/summary
 * Get transaction summary (total amount, count) for a tenant
 * Query: ?startDate=2024-01-01&endDate=2024-12-31
 */
router.get('/tenants/:tenantId/summary', internalOrAuth, getTransactionSummary);

// ============================================
// TRANSACTION STATUS - Query Safaricom
// ============================================

/**
 * GET /api/v1/mpesa/status/:checkoutRequestId
 * Query transaction status from Safaricom API
 */
router.get('/status/:checkoutRequestId', queryTransactionStatus);

// ============================================
// CALLBACK - M-Pesa Webhook (Public)
// ============================================

/**
 * POST /api/v1/mpesa/callback
 * M-Pesa callback endpoint (public, no auth required)
 */
router.post('/callback', handleCallback);

// ============================================
// ADMIN - Manual Transaction Update (Debug)
// ============================================

/**
 * POST /api/v1/mpesa/transactions/:transactionId/status
 * Manually update transaction status (for debugging/testing)
 */
router.post('/transactions/:transactionId/status', internalOrAuth, updateTransaction);

export default router;