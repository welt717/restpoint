import { initiateBilling, handleMpesaWebhook } from '../services/index.js';
import { queryStkStatus } from '../services/stkQuery.js';
import { 
  getTenantTransactions, 
  getTenantTransactionSummary, 
  getTransactionByTenant,
  updateTransactionStatus 
} from '../services/transactionService.js';
import Logger from '../utils/logger.js';

/**
 * Handle STK Push Request from tenants
 */
export const stkPushRequest = async (req, res) => {
  Logger.info('[M-Pesa Controller] STK Push Request:', JSON.stringify(req.body, null, 2));
  try {
    const result = await initiateBilling(req.body);
    res.status(200).json(result);
  } catch (error) {
    Logger.error('[M-Pesa Controller] STK Push Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Handle Callback from M-Pesa (public endpoint)
 */
export const handleCallback = async (req, res) => {
  await handleMpesaWebhook(req, res);
};

/**
 * Query Transaction Status from Safaricom
 */
export const queryTransactionStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;

  if (!checkoutRequestId) {
    return res.status(400).json({ success: false, message: 'CheckoutRequestID is required' });
  }

  try {
    const result = await queryStkStatus(checkoutRequestId);
    res.status(200).json(result);
  } catch (error) {
    Logger.error('[M-Pesa Controller] Status Query Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get transaction history for a tenant
 * GET /api/v1/mpesa/tenants/:tenantId/transactions
 */
export const getTransactionHistory = async (req, res) => {
  const { tenantId } = req.params;
  const { page, limit, status, startDate, endDate, phoneNumber } = req.query;

  if (!tenantId) {
    return res.status(400).json({ success: false, message: 'Tenant ID is required' });
  }

  try {
    const result = await getTenantTransactions(tenantId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      startDate,
      endDate,
      phoneNumber
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    Logger.error('[M-Pesa Controller] Transaction History Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get transaction summary for a tenant
 * GET /api/v1/mpesa/tenants/:tenantId/summary
 */
export const getTransactionSummary = async (req, res) => {
  const { tenantId } = req.params;
  const { startDate, endDate } = req.query;

  if (!tenantId) {
    return res.status(400).json({ success: false, message: 'Tenant ID is required' });
  }

  try {
    const summary = await getTenantTransactionSummary(tenantId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    Logger.error('[M-Pesa Controller] Summary Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single transaction details
 * GET /api/v1/mpesa/tenants/:tenantId/transactions/:transactionId
 */
export const getTransaction = async (req, res) => {
  const { tenantId, transactionId } = req.params;

  if (!tenantId || !transactionId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tenant ID and Transaction ID are required' 
    });
  }

  try {
    const transaction = await getTransactionByTenant(tenantId, transactionId);

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    Logger.error('[M-Pesa Controller] Get Transaction Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Manual status update (for debugging/testing)
 * POST /api/v1/mpesa/transactions/:transactionId/status
 */
export const updateTransaction = async (req, res) => {
  const { transactionId } = req.params;
  const { status, mpesaReceipt } = req.body;

  if (!transactionId || !status) {
    return res.status(400).json({ 
      success: false, 
      message: 'Transaction ID and status are required' 
    });
  }

  try {
    await updateTransactionStatus(transactionId, status, mpesaReceipt, { manual: true });
    
    res.status(200).json({
      success: true,
      message: `Transaction ${transactionId} updated to ${status}`
    });
  } catch (error) {
    Logger.error('[M-Pesa Controller] Update Transaction Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};