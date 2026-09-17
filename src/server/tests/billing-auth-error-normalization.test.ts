import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import express, { type Express } from 'express';
import request from 'supertest';
import { User } from '../models/User.js';
import { Tenant } from '../models/Tenant.js';
import { Plan } from '../models/Plan.js';
import { normalizeErrorMessage } from '../../client/utils/notify.js';
import { apiRouter } from '../routes/api.js';
import { errorHandler } from '../errors/handlers.js';
import jwt from 'jsonwebtoken';
import { config } from '../../config/environment.js';

describe('Billing 401 Authentication & Error Normalization Comprehensive Suite', () => {
  it('PUT /api/v1/billing/admin/plans/:id updates plan cleanly when request body includes version and metadata without conflict', async () => {
    // 1. Create a test plan
    const initialPlan = await Plan.create({
      name: 'Conflict Check Plan',
      slug: 'conflict-check-' + Date.now(),
      tier: 'STARTER',
      price: 15000,
      currency: 'NGN',
      billingInterval: 'MONTHLY',
      features: { pos: true, inventory: true },
      limits: { users: { count: 5, unlimited: false }, products: { count: 500, unlimited: false } },
      status: 'ACTIVE',
      version: 1,
    });

    // 2. Client sends payload containing version: 1, _id, createdAt, __v
    const payload = {
      _id: initialPlan._id.toString(),
      name: 'Conflict Check Plan Updated',
      version: initialPlan.version,
      tier: 'STARTER',
      price: 19500,
      currency: 'NGN',
      billingInterval: 'MONTHLY',
      features: { pos: true, inventory: true },
      limits: {
        users: { count: 12, unlimited: false },
        products: { count: 1200, unlimited: false },
      },
      status: 'ACTIVE',
      createdAt: initialPlan.createdAt,
      updatedAt: initialPlan.updatedAt,
      __v: 0,
    };

    const res = await request(app)
      .put(`/api/v1/billing/admin/plans/${initialPlan._id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Conflict Check Plan Updated');
    expect(res.body.data.price).toBe(19500);
    expect(res.body.data.version).toBe(2); // Increment was executed safely without conflict
  });

  let app: Express;
  let superAdminToken: string;
  let companyOwnerToken: string;
  let companyBToken: string;
  let tenantAId: string;
  let tenantBId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockora_test';
      await mongoose.connect(mongoUri);
    }

    app = express();
    app.use(express.json());
    app.use('/api/v1', apiRouter);
    app.use('/api', apiRouter);
    app.use(errorHandler);

    await User.deleteMany({ email: /@billing-test\.com/ });
    await Tenant.deleteMany({ slug: /billing-test-/ });

    await Plan.findOneAndUpdate(
      { slug: 'pro' },
      {
        name: 'Professional',
        slug: 'pro',
        tier: 'GROWTH',
        price: 25000,
        currency: 'NGN',
        status: 'ACTIVE',
        limits: {
          users: { count: 10, unlimited: false },
          branches: { count: 3, unlimited: false },
          warehouses: { count: 2, unlimited: false },
          posTerminals: { count: 5, unlimited: false },
          products: { count: 5000, unlimited: false },
        },
      },
      { upsert: true, new: true }
    );

    const tenantA = await Tenant.create({
      name: 'Billing Test Tenant A',
      slug: 'billing-test-tenant-a',
      status: 'ACTIVE',
      subscriptionTier: 'GROWTH',
      contact: { email: 'tenant-a@billing-test.com' },
    });
    tenantAId = tenantA._id.toString();

    const tenantB = await Tenant.create({
      name: 'Billing Test Tenant B',
      slug: 'billing-test-tenant-b',
      status: 'ACTIVE',
      subscriptionTier: 'GROWTH',
      contact: { email: 'tenant-b@billing-test.com' },
    });
    tenantBId = tenantB._id.toString();

    const superAdmin = await User.create({
      username: 'superadmin_billing',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@billing-test.com',
      password: 'Password123!',
      roleName: 'Super Administrator',
      isPlatformAdmin: true,
      emailVerified: true,
    });
    superAdminToken = jwt.sign(
      {
        id: superAdmin._id.toString(),
        email: superAdmin.email,
        roleName: 'Super Administrator',
        isPlatformAdmin: true,
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const ownerA = await User.create({
      username: 'ownera_billing',
      firstName: 'Owner',
      lastName: 'A',
      email: 'owner-a@billing-test.com',
      password: 'Password123!',
      roleName: 'Company Owner',
      tenantId: tenantA._id,
      emailVerified: true,
    });
    companyOwnerToken = jwt.sign(
      {
        id: ownerA._id.toString(),
        email: ownerA.email,
        roleName: 'Company Owner',
        tenantId: tenantAId,
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const ownerB = await User.create({
      username: 'ownerb_billing',
      firstName: 'Owner',
      lastName: 'B',
      email: 'owner-b@billing-test.com',
      password: 'Password123!',
      roleName: 'Company Owner',
      tenantId: tenantB._id,
      emailVerified: true,
    });
    companyBToken = jwt.sign(
      {
        id: ownerB._id.toString(),
        email: ownerB.email,
        roleName: 'Company Owner',
        tenantId: tenantBId,
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@billing-test\.com/ });
    await Tenant.deleteMany({ slug: /billing-test-/ });
  });

  describe('Authentication & Tenant Security', () => {
    it('1. Valid authenticated Super Admin accesses platform billing admin endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/billing/admin/plans')
        .set('Authorization', 'Bearer ' + superAdminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('2. Missing token returns 401 with standard error format', async () => {
      const res = await request(app).get('/api/v1/billing/subscription');
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(typeof res.body.error.message).toBe('string');
    });

    it('3. Valid token accesses every tenant Billing endpoint', async () => {
      const endpoints = [
        '/api/v1/billing/subscription',
        '/api/v1/billing/usage',
        '/api/v1/billing/invoices',
        '/api/v1/billing/transactions',
      ];
      for (const ep of endpoints) {
        const res = await request(app)
          .get(ep)
          .set('Authorization', 'Bearer ' + companyOwnerToken)
          .set('x-tenant-id', tenantAId);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    it('4. Expired / Invalid token returns 401 Unauthorized', async () => {
      const expiredToken = jwt.sign({ id: 'some-user-id' }, config.jwtSecret, {
        expiresIn: '-10s',
      });
      const res = await request(app)
        .get('/api/v1/billing/subscription')
        .set('Authorization', 'Bearer ' + expiredToken);
      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/expired|invalid/i);
    });

    it('5. Malformed Bearer token returns 401', async () => {
      const res = await request(app)
        .get('/api/v1/billing/subscription')
        .set('Authorization', 'Bearer not.a.valid.jwt.token');
      expect(res.status).toBe(401);
    });

    it('6. Non-super admin attempting platform admin billing route returns 403', async () => {
      const res = await request(app)
        .get('/api/v1/billing/admin/plans')
        .set('Authorization', 'Bearer ' + companyOwnerToken);
      expect(res.status).toBe(403);
    });

    it('7. Tenant cross-access isolation: Company B cannot access Company A billing context', async () => {
      const res = await request(app)
        .get('/api/v1/billing/subscription')
        .set('Authorization', 'Bearer ' + companyBToken)
        .set('x-tenant-id', tenantAId);
      expect(res.status).toBe(403);
    });

    it('8. Two different companies access Billing simultaneously with proper data isolation', async () => {
      const [resA, resB] = await Promise.all([
        request(app)
          .get('/api/v1/billing/subscription')
          .set('Authorization', 'Bearer ' + companyOwnerToken)
          .set('x-tenant-id', tenantAId),
        request(app)
          .get('/api/v1/billing/subscription')
          .set('Authorization', 'Bearer ' + companyBToken)
          .set('x-tenant-id', tenantBId),
      ]);
      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
      expect(resA.body.data.tenantId).toBe(tenantAId);
      expect(resB.body.data.tenantId).toBe(tenantBId);
    });
  });

  describe('Error Normalization & Safe Rendering', () => {
    it('16. Error object containing message/status/code/stack is safely normalized to a string', () => {
      const rawApiError = {
        message: 'Plan quota reached for user seats',
        status: 400,
        code: 'VALIDATION_ERROR',
        stack: 'Error: Plan quota reached\n    at Object.test',
      };
      const result = normalizeErrorMessage(rawApiError);
      expect(typeof result).toBe('string');
      expect(result).toBe('Plan quota reached for user seats');
      expect(result).not.toContain('stack');
    });

    it('16b. Axios nested error response with { error: { message, status, code, stack } } is normalized', () => {
      const axiosError = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Session expired or invalid token.',
              status: 401,
              code: 'AUTHENTICATION_ERROR',
              stack: 'Error: Session expired',
            },
          },
        },
      };
      const result = normalizeErrorMessage(axiosError);
      expect(typeof result).toBe('string');
      expect(result).toBe('Session expired or invalid token.');
    });

    it('15. Malformed/unexpected API error fallback to safe message', () => {
      const weirdError = { randomKey: [1, 2, 3], nested: { foo: 'bar' } };
      const result = normalizeErrorMessage(weirdError, 'Operation failed.');
      expect(typeof result).toBe('string');
      expect(result).toBe('Operation failed.');
    });

    it('17. ErrorBoundary receives unknown error and produces safe string', () => {
      const thrownObject = { unexpected: true, code: 500 };
      const result = normalizeErrorMessage(thrownObject);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe('[object Object]');
    });
  });
});
