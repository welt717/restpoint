import { recordTransaction } from './transactionService.js';
import { initiateStkPush } from './stkPush.js';
import Logger from '../utils/logger.js';

/**
 * Handle STK Push payment requests from tenants
 * This is the single entry point for all tenant STK Push requests
 */
export const initiateBilling = async (data) => {
  const {
    tenantId,
    userId,
    phoneNumber,
    amount,
    type = 'service',
    reference,
    description,
    accountReference,
    transactionDesc
  } = data;

  if (!tenantId) throw new Error('Tenant ID is required');
  if (!phoneNumber) throw new Error('Phone number is required');
  if (!amount || Number(amount) < 1) throw new Error('Valid amount is required');

  Logger.info(`💰 [Billing] Initiating | Tenant: ${tenantId} | User: ${userId} | Amount: ${amount} | Type: ${type}`);

  try {
    // Build account reference and description
    const ref = accountReference 
      || (reference ? `${type.toUpperCase()}-${reference}`.substring(0, 20) 
      : `BILL-${Date.now()}`.substring(0, 20));

    const desc = transactionDesc 
      || description 
      || `${type} payment for tenant ${tenantId}`;

    // Initiate STK Push (uses global M-Pesa config)
    const stkResponse = await initiateStkPush(
      phoneNumber, 
      amount, 
      ref, 
      desc
    );

    if (stkResponse.ResponseCode === '0') {
      // Record pending transaction
      await recordTransaction({
        tenantId,
        transactionId: stkResponse.CheckoutRequestID,
        phoneNumber,
        amount,
        type,
        reference,
        status: 'pending',
        description: desc
      });

      return {
        success: true,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        message: stkResponse.CustomerMessage || 'STK Push sent. Check your phone.',
        data: {
          checkoutRequestId: stkResponse.CheckoutRequestID,
          amount,
          phoneNumber,
          type,
          reference
        }
      };
    }

    throw new Error(stkResponse.ResponseDescription || 'Failed to initiate payment');
  } catch (error) {
    Logger.error(`❌ [Billing] Error: ${error.message}`);
    throw error;
  }
};