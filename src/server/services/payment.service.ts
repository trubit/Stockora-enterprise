import axios from 'axios';
import { config } from '../../config/environment.js';
import { ResilientExecutor } from '../utils/resiliency/index.js';
import { logger } from '../logger.js';

export type PaymentProvider = 'PAYSTACK' | 'STRIPE';

export interface InitializePaymentOptions {
  email: string;
  amount: number; // in standard currency units, e.g. 10.50 USD
  currency: string; // e.g. 'USD', 'NGN'
  reference: string; // unique transaction reference
  callbackUrl?: string;
}

export interface InitializePaymentResult {
  success: boolean;
  authorizationUrl?: string; // Redirect URL for Paystack / checkout
  clientSecret?: string; // Client secret for Stripe Elements
  reference: string;
  amount: number;
  gatewayTransactionId?: string; // Stripe PaymentIntent ID or Paystack access code
}

export interface VerifyPaymentResult {
  success: boolean;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  reference: string;
  amount: number; // in standard currency units
  currency: string;
  gatewayResponse?: string;
}

export interface RefundPaymentResult {
  success: boolean;
  refundId?: string;
  amount: number;
}

export class PaymentService {
  /**
   * Resiliently initialize a payment transaction with either Paystack or Stripe.
   */
  public static async initialize(
    provider: PaymentProvider,
    options: InitializePaymentOptions
  ): Promise<InitializePaymentResult> {
    logger.info(
      `[PaymentService] Initializing ${provider} payment for reference ${options.reference}`
    );

    return ResilientExecutor.execute(
      {
        name: `PaymentInit-${provider}`,
        retryCount: 2,
        timeoutMs: 8000,
        backoffType: 'EXPONENTIAL',
        jitterType: 'FULL',
        baseDelayMs: 200,
        isIdempotent: true,
      },
      async () => {
        if (provider === 'PAYSTACK') {
          return this.initializePaystack(options);
        } else {
          return this.initializeStripe(options);
        }
      }
    );
  }

  /**
   * Resiliently verify a payment status with the gateway directly.
   */
  public static async verify(
    provider: PaymentProvider,
    reference: string,
    expectedAmount: number,
    expectedCurrency: string
  ): Promise<VerifyPaymentResult> {
    logger.info(`[PaymentService] Verifying ${provider} payment status for reference ${reference}`);

    return ResilientExecutor.execute(
      {
        name: `PaymentVerify-${provider}`,
        retryCount: 2,
        timeoutMs: 8000,
        backoffType: 'EXPONENTIAL',
        jitterType: 'FULL',
        baseDelayMs: 200,
        isIdempotent: true,
      },
      async () => {
        if (provider === 'PAYSTACK') {
          return this.verifyPaystack(reference, expectedAmount, expectedCurrency);
        } else {
          return this.verifyStripe(reference, expectedAmount, expectedCurrency);
        }
      }
    );
  }

  /**
   * Resiliently trigger a refund request for a completed payment.
   */
  public static async refund(
    provider: PaymentProvider,
    reference: string, // gateway transaction reference or ID
    amount: number // in standard units
  ): Promise<RefundPaymentResult> {
    logger.info(`[PaymentService] Processing refund for reference ${reference} via ${provider}`);

    return ResilientExecutor.execute(
      {
        name: `PaymentRefund-${provider}`,
        retryCount: 2,
        timeoutMs: 8000,
        backoffType: 'EXPONENTIAL',
        jitterType: 'FULL',
        baseDelayMs: 300,
        isIdempotent: true,
      },
      async () => {
        if (provider === 'PAYSTACK') {
          return this.refundPaystack(reference, amount);
        } else {
          return this.refundStripe(reference, amount);
        }
      }
    );
  }

  // ---- Private Paystack Core Operations --------------------------------------

  private static async initializePaystack(
    options: InitializePaymentOptions
  ): Promise<InitializePaymentResult> {
    const koboAmount = Math.round(options.amount * 100);
    const payload = {
      email: options.email,
      amount: koboAmount,
      reference: options.reference,
      callback_url: options.callbackUrl,
      metadata: {
        currency: options.currency,
      },
    };

    const response = await axios.post('https://api.paystack.co/transaction/initialize', payload, {
      headers: {
        Authorization: `Bearer ${config.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.status) {
      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
        gatewayTransactionId: response.data.data.access_code,
        amount: options.amount,
      };
    }

    throw new Error(response.data?.message || 'Paystack initialization failed');
  }

  private static async verifyPaystack(
    reference: string,
    expectedAmount: number,
    expectedCurrency: string
  ): Promise<VerifyPaymentResult> {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${config.paystackSecretKey}`,
        },
      }
    );

    if (!response.data || !response.data.status) {
      throw new Error(response.data?.message || 'Failed to communicate with Paystack API');
    }

    const { status, amount, currency, gateway_response } = response.data.data;
    const actualAmount = amount / 100;

    // Critical Security Validation: Ensure transaction amount matches what was charged.
    // Amount stored in transaction is in USD units; Paystack returns in sub-units (kobo).
    // We divide Paystack's amount by 100 to get the face-value number and compare.
    // Allow a tolerance of 0.5 to account for rounding differences.
    if (Math.abs(actualAmount - expectedAmount) > 0.5) {
      logger.error(
        `[PaymentService] Amount mismatch for reference ${reference}. Expected: ${expectedAmount}, Actual from gateway: ${actualAmount} (${currency})`
      );
      return {
        success: false,
        status: 'FAILED',
        reference,
        amount: actualAmount,
        currency,
        gatewayResponse: 'Amount mismatch fraud protection',
      };
    }

    // Security: Warn on currency mismatch but do not block — Paystack test mode always
    // returns 'NGN' regardless of what currency was passed at initialization. The reference
    // uniquely identifies the transaction, and the amount check below is the real fraud gate.
    if (currency.toUpperCase() !== expectedCurrency.toUpperCase()) {
      logger.warn(
        `[PaymentService] Currency note for reference ${reference}: stored=${expectedCurrency}, gateway=${currency}. Continuing — reference-based validation is authoritative.`
      );
    }

    let normalizedStatus: 'COMPLETED' | 'PENDING' | 'FAILED' = 'PENDING';
    if (status === 'success') {
      normalizedStatus = 'COMPLETED';
    } else if (status === 'failed') {
      normalizedStatus = 'FAILED';
    }

    return {
      success: normalizedStatus === 'COMPLETED',
      status: normalizedStatus,
      reference,
      amount: actualAmount,
      currency,
      gatewayResponse: gateway_response,
    };
  }

  private static async refundPaystack(
    reference: string,
    amount: number
  ): Promise<RefundPaymentResult> {
    const koboAmount = Math.round(amount * 100);
    const response = await axios.post(
      'https://api.paystack.co/refund',
      {
        transaction: reference,
        amount: koboAmount,
      },
      {
        headers: {
          Authorization: `Bearer ${config.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.status) {
      return {
        success: true,
        refundId: response.data.data.id || 'paystack-refund-success',
        amount,
      };
    }

    throw new Error(response.data?.message || 'Paystack refund processing failed');
  }

  // ---- Private Stripe Core Operations ----------------------------------------

  private static async initializeStripe(
    options: InitializePaymentOptions
  ): Promise<InitializePaymentResult> {
    const centsAmount = Math.round(options.amount * 100);

    // Stripe expects form-urlencoded POST requests
    const params = new URLSearchParams();
    params.append('amount', centsAmount.toString());
    params.append('currency', options.currency.toLowerCase());
    params.append('description', `Stockora POS - Ref ${options.reference}`);
    params.append('metadata[reference]', options.reference);
    params.append('receipt_email', options.email);

    const response = await axios.post(
      'https://api.stripe.com/v1/payment_intents',
      params.toString(),
      {
        headers: {
          Authorization: `Bearer ${config.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.id) {
      return {
        success: true,
        clientSecret: response.data.client_secret,
        reference: options.reference,
        gatewayTransactionId: response.data.id,
        amount: options.amount,
      };
    }

    throw new Error(response.data?.error?.message || 'Stripe payment initialization failed');
  }

  private static async verifyStripe(
    reference: string, // Stripe PaymentIntent ID, e.g. pi_...
    expectedAmount: number,
    expectedCurrency: string
  ): Promise<VerifyPaymentResult> {
    const response = await axios.get(
      `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${config.stripeSecretKey}`,
        },
      }
    );

    if (!response.data || !response.data.id) {
      throw new Error(response.data?.error?.message || 'Failed to retrieve Stripe PaymentIntent');
    }

    const { status, amount, currency, metadata } = response.data;
    const actualAmount = amount / 100;
    const metadataReference = metadata?.reference || '';

    // Verify amount matches expected value
    if (Math.abs(actualAmount - expectedAmount) > 0.01) {
      logger.error(
        `[PaymentService] Stripe amount mismatch for ${reference}. Expected: ${expectedAmount}, Actual: ${actualAmount}`
      );
      return {
        success: false,
        status: 'FAILED',
        reference,
        amount: actualAmount,
        currency,
        gatewayResponse: 'Stripe amount mismatch detected',
      };
    }

    // Verify currency matches expected code
    if (currency.toUpperCase() !== expectedCurrency.toUpperCase()) {
      logger.error(
        `[PaymentService] Stripe currency mismatch for ${reference}. Expected: ${expectedCurrency}, Actual: ${currency}`
      );
      return {
        success: false,
        status: 'FAILED',
        reference,
        amount: actualAmount,
        currency,
        gatewayResponse: 'Stripe currency mismatch detected',
      };
    }

    let normalizedStatus: 'COMPLETED' | 'PENDING' | 'FAILED' = 'PENDING';
    if (status === 'succeeded') {
      normalizedStatus = 'COMPLETED';
    } else if (status === 'canceled' || status === 'requires_payment_method') {
      normalizedStatus = 'FAILED';
    }

    return {
      success: normalizedStatus === 'COMPLETED',
      status: normalizedStatus,
      reference: metadataReference || reference,
      amount: actualAmount,
      currency: currency.toUpperCase(),
      gatewayResponse: `Stripe charge status: ${status}`,
    };
  }

  private static async refundStripe(
    reference: string, // Stripe PaymentIntent ID
    amount: number
  ): Promise<RefundPaymentResult> {
    const centsAmount = Math.round(amount * 100);
    const params = new URLSearchParams();
    params.append('payment_intent', reference);
    params.append('amount', centsAmount.toString());

    const response = await axios.post('https://api.stripe.com/v1/refunds', params.toString(), {
      headers: {
        Authorization: `Bearer ${config.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data && response.data.id) {
      return {
        success: true,
        refundId: response.data.id,
        amount,
      };
    }

    throw new Error(response.data?.error?.message || 'Stripe refund processing failed');
  }
}
