import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import axios from 'axios';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';
import { PaymentService } from '../services/payment.service.js';
import { PaymentController } from '../controllers/payment.controller.js';

// Mock axios globally for tests
vi.mock('axios');

describe('Secure Payment Gateway & Resiliency tests', () => {
  let productId: string;

  beforeAll(async () => {
    // Connect to test database pool
    await mongoose.connect('mongodb://127.0.0.1:27017/stockora_test_payments');
    await Product.deleteMany({});
    await Transaction.deleteMany({});

    // Create a catalog test product
    const product = await Product.create({
      sku: 'SKU-CARD-PAY-1',
      name: 'Resilient Payment Terminal',
      category: 'Electronics',
      costPrice: 150.0,
      sellingPrice: 300.0,
      price: 300.0,
      cost: 150.0,
      quantity: 50,
      lowStockAlert: 5,
    });
    productId = product._id.toString();
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Transaction.deleteMany({});
    await mongoose.connection.close();
  });

  it('should resiliently initialize a Paystack payment session', async () => {
    const mockAxiosResponse = {
      data: {
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/auth-code-123',
          reference: 'TX-PAY-123456',
          access_code: 'access_code_123',
        },
      },
    };
    vi.mocked(axios.post).mockResolvedValueOnce(mockAxiosResponse);

    const result = await PaymentService.initialize('PAYSTACK', {
      email: 'pos-buyer@test.com',
      amount: 300.0,
      currency: 'NGN',
      reference: 'TX-PAY-123456',
      callbackUrl: 'http://localhost:8080/callback',
    });

    expect(result.success).toBe(true);
    expect(result.authorizationUrl).toBe('https://checkout.paystack.com/auth-code-123');
    expect(result.gatewayTransactionId).toBe('access_code_123');
    expect(result.reference).toBe('TX-PAY-123456');
  });

  it('should verify payment successfully directly with the provider', async () => {
    const mockAxiosResponse = {
      data: {
        status: true,
        data: {
          status: 'success',
          amount: 30000, // 300.00 standard NGN
          currency: 'NGN',
          gateway_response: 'Successful transaction',
          reference: 'TX-PAY-123456',
        },
      },
    };
    vi.mocked(axios.get).mockResolvedValueOnce(mockAxiosResponse);

    const verification = await PaymentService.verify('PAYSTACK', 'TX-PAY-123456', 300.0, 'NGN');

    expect(verification.success).toBe(true);
    expect(verification.status).toBe('COMPLETED');
    expect(verification.amount).toBe(300.0);
    expect(verification.currency).toBe('NGN');
  });

  it('should block double-spend and verify details mismatch strictly', async () => {
    // Create a mock transaction record
    const reference = 'TX-SEC-FRAUD-1';
    await Transaction.create({
      transactionNumber: reference,
      type: 'SALE',
      status: 'PENDING',
      items: [
        {
          productId,
          productName: 'Resilient Payment Terminal',
          sku: 'SKU-CARD-PAY-1',
          quantity: 1,
          price: 300.0,
          discount: 0,
          total: 300.0,
        },
      ],
      subtotal: 300.0,
      tax: 0,
      total: 300.0,
      paymentMethod: 'CARD',
      currencyCode: 'USD',
      cashierId: 'cashier-1',
      cashierName: 'POS Operator',
      branchId: 'branch-1',
      branchName: 'Main HQ',
    });

    // Mock direct gateway response returning mismatched amount
    const mockMismatchedResponse = {
      data: {
        status: true,
        data: {
          status: 'success',
          amount: 15000, // $150.00 instead of $300.00 (Fraud trigger)
          currency: 'USD',
          gateway_response: 'Tampered Amount Received',
          reference,
        },
      },
    };
    vi.mocked(axios.get).mockResolvedValueOnce(mockMismatchedResponse);

    // Call checkout verify
    const result = await PaymentController.verifyAndProcessPayment('PAYSTACK', reference);

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');

    // Check database state updated to CANCELLED
    const updatedTx = await Transaction.findOne({ transactionNumber: reference });
    expect(updatedTx?.status).toBe('CANCELLED');
  });

  it('should retry transient connection errors using ResilientExecutor exponential backoff', async () => {
    // 1st request fails (Network timeout simulation)
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Transient connection error'));

    // 2nd request succeeds
    const mockSuccessResponse = {
      data: {
        status: true,
        data: {
          status: 'success',
          amount: 30000,
          currency: 'USD',
          gateway_response: 'Successful after retry',
          reference: 'TX-RETRY-1',
        },
      },
    };
    vi.mocked(axios.get).mockResolvedValueOnce(mockSuccessResponse);

    // Run verification with retry policy activated
    const verificationResult = await PaymentService.verify('PAYSTACK', 'TX-RETRY-1', 300.0, 'USD');

    expect(verificationResult.success).toBe(true);
    expect(verificationResult.status).toBe('COMPLETED');
    expect(verificationResult.gatewayResponse).toBe('Successful after retry');
  });
});
