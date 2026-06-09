import db from '../config/db.js';
import Logger from '../utils/logger.js';

/**
 * Record a payment transaction in the database
 */
export const recordTransaction = async (data) => {
  const {
    tenantId,
    transactionId,
    phoneNumber,
    amount,
    type,
    reference,
    status,
    description,
    message
  } = data;

  try {
    await db('payments').insert({
      tenant_id: tenantId,
      transaction_id: transactionId,
      phone_number: phoneNumber,
      amount: amount,
      payment_type: type || 'service',
      reference: reference || null,
      status: status || 'pending',
      description: description || null,
      message: message || null,
      created_at: new Date(),
      updated_at: new Date()
    });
    Logger.info(`✅ [TX] Recorded: ${transactionId} | Tenant: ${tenantId} | Amount: ${amount}`);
  } catch (error) {
    Logger.error(`❌ [TX] Failed to record transaction ${transactionId}: ${error.message}`);
    throw error;
  }
};

/**
 * Get transaction by CheckoutRequestID
 */
export const getTransaction = async (transactionId) => {
  try {
    return await db('payments').where({ transaction_id: transactionId }).first();
  } catch (error) {
    Logger.warn(`⚠️ [TX] Could not get transaction ${transactionId}: ${error.message}`);
    return null;
  }
};

/**
 * Update transaction status after callback
 */
export const updateTransactionStatus = async (transactionId, status, mpesaReceipt, callbackData) => {
  try {
    const updateData = {
      status: status,
      mpesa_receipt: mpesaReceipt || null,
      callback_data: callbackData ? JSON.stringify(callbackData) : null,
      updated_at: new Date()
    };

    if (status === 'completed') {
      updateData.receipt_number = mpesaReceipt;
    }

    await db('payments')
      .where({ transaction_id: transactionId })
      .update(updateData);
    
    Logger.info(`🔄 [TX] Updated: ${transactionId} → ${status}`);
  } catch (error) {
    Logger.error(`⚠️ [TX] Could not update transaction ${transactionId}: ${error.message}`);
  }
};

/**
 * Get transaction history for a tenant
 */
export const getTenantTransactions = async (tenantId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    phoneNumber
  } = options;

  try {
    let query = db('payments')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');

    // Apply filters
    if (status) {
      query = query.where({ status });
    }
    if (startDate) {
      query = query.where('created_at', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('created_at', '<=', new Date(endDate));
    }
    if (phoneNumber) {
      query = query.where('phone_number', 'like', `%${phoneNumber}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      query.limit(limit).offset(offset),
      db('payments').where({ tenant_id: tenantId }).count('id as count').first()
    ]);

    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    };
  } catch (error) {
    Logger.error(`❌ [TX] Failed to get tenant transactions: ${error.message}`);
    return { transactions: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
  }
};

/**
 * Get transaction summary for a tenant
 */
export const getTenantTransactionSummary = async (tenantId, startDate, endDate) => {
  try {
    let query = db('payments')
      .where({ tenant_id: tenantId, status: 'completed' });

    if (startDate) {
      query = query.where('created_at', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('created_at', '<=', new Date(endDate));
    }

    const summary = await query
      .sum('amount as total_amount')
      .count('id as total_transactions')
      .first();

    return {
      totalAmount: parseFloat(summary.total_amount) || 0,
      totalTransactions: parseInt(summary.total_transactions) || 0
    };
  } catch (error) {
    Logger.error(`❌ [TX] Failed to get summary: ${error.message}`);
    return { totalAmount: 0, totalTransactions: 0 };
  }
};

/**
 * Get single transaction with tenant verification
 */
export const getTransactionByTenant = async (tenantId, transactionId) => {
  try {
    return await db('payments')
      .where({ transaction_id: transactionId, tenant_id: tenantId })
      .first();
  } catch (error) {
    Logger.warn(`⚠️ [TX] Could not get transaction: ${error.message}`);
    return null;
  }
};