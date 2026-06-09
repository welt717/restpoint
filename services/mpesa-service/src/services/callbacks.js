import axios from 'axios';
import { updateTransactionStatus, getTransaction } from './transactionService.js';
import Logger from '../utils/logger.js';

/**
 * Handle M-Pesa STK Push Callback
 */
export const processCallback = async (callbackData, origin = 'wallet') => {
  const { Body } = callbackData;
  
  if (!Body || !Body.stkCallback) {
    throw new Error('Invalid callback data');
  }

  const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = Body.stkCallback;

  if (ResultCode === 0) {
    const metadata = CallbackMetadata.Item;
    const amount = metadata.find(item => item.Name === 'Amount')?.Value;
    const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
    const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
    const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

    Logger.info(`✅ Payment Success: ${mpesaReceiptNumber} - ${amount} from ${phoneNumber}`);
    
    // Get pending transaction to retrieve tenant and reference info
    const pendingTx = await getTransaction(CheckoutRequestID);
    
    if (!pendingTx) {
      Logger.warn(`⚠️ Transaction not found: ${CheckoutRequestID}`);
      return { success: false, message: 'Transaction not found' };
    }

    const tenantId = pendingTx.tenant_id;
    const reference = pendingTx.reference || pendingTx.transaction_id;

    // Update DB with success status
    await updateTransactionStatus(CheckoutRequestID, 'completed', mpesaReceiptNumber, {
      ...Body,
      tenantId,
      reference
    });

    // Notify the origin service with tenant info
    await notifyService(origin, {
      checkoutRequestId: CheckoutRequestID,
      tenantId,
      reference,
      receipt: mpesaReceiptNumber,
      amount,
      phoneNumber,
      date: transactionDate,
      status: 'completed',
      type: pendingTx.payment_type
    });
    
    Logger.info(`✅ Payment processed for tenant ${tenantId}: ${mpesaReceiptNumber}`);
    return { success: true, message: 'Payment processed successfully' };
  } else {
    Logger.info(`❌ Payment Failed: ${ResultDesc} (Code: ${ResultCode})`);
    
    // Get transaction for tenant info
    const pendingTx = await getTransaction(CheckoutRequestID);
    const tenantId = pendingTx?.tenant_id;

    // Update DB with failed status
    await updateTransactionStatus(CheckoutRequestID, 'failed', null, {
      ...Body,
      tenantId,
      errorCode: ResultCode,
      errorMessage: ResultDesc
    });

    // Notify the origin service
    await notifyService(origin, {
      checkoutRequestId: CheckoutRequestID,
      tenantId,
      status: 'failed',
      message: ResultDesc,
      errorCode: ResultCode
    });
    
    return { success: false, message: ResultDesc };
  }
};

/**
 * Notify the originating service about the payment status
 */
const notifyService = async (origin, data) => {
  const serviceUrls = {
    wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:8008/api/v1/wallet/mpesa/internal-callback',
    marketplace: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:8004/api/v1/marketplace/payments/callback',
    billing: process.env.BILLING_SERVICE_URL || 'http://localhost:8006/api/v1/billing/payments/callback',
    subscription: process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:8010/api/v1/subscription/payments/callback'
  };

  const url = serviceUrls[origin];
  if (url) {
    try {
      await axios.post(url, data, {
        headers: { 'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET || 'siasahub_internal_secret_2026' }
      });
      Logger.info(`📡 Successfully notified ${origin} service`);
    } catch (error) {
      Logger.error(`❌ Failed to notify ${origin} service: ${error.message}`);
    }
  } else {
    Logger.warn(`⚠️ No callback URL configured for origin: ${origin}`);
  }
};