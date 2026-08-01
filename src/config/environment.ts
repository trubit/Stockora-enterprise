import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string({ required_error: 'MONGODB_URI is required' }),
  REDIS_URL: z.string({ required_error: 'REDIS_URL is required' }),
  JWT_SECRET: z.string({ required_error: 'JWT_SECRET is required' }),
  JWT_REFRESH_SECRET: z.string({ required_error: 'JWT_REFRESH_SECRET is required' }),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  UPLOAD_MAX_SIZE: z.coerce.number().default(5242880),
  PAYSTACK_SECRET_KEY: z.string().optional().default('sk_test_paystack_secret_placeholder'),
  PAYSTACK_PUBLIC_KEY: z.string().optional().default('pk_test_paystack_public_placeholder'),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional().default('whsec_paystack_webhook_placeholder'),
  STRIPE_SECRET_KEY: z.string().optional().default('sk_test_stripe_secret_placeholder'),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default('whsec_stripe_webhook_placeholder'),
});

let parsedEnv: z.infer<typeof envSchema>;

try {
  const envSource = typeof process !== 'undefined' ? process.env : {};
  parsedEnv = envSchema.parse(envSource);
} catch (error) {
  if (error instanceof z.ZodError) {
    const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    console.error('Environment validation error:', issues);
  } else {
    console.error('Unexpected environment validation error:', error);
  }
  process.exit(1);
}

export const config = {
  port: parsedEnv.PORT,
  env: parsedEnv.NODE_ENV,
  mongodbUri: parsedEnv.MONGODB_URI,
  redisUrl: parsedEnv.REDIS_URL,
  jwtSecret: parsedEnv.JWT_SECRET,
  jwtRefreshSecret: parsedEnv.JWT_REFRESH_SECRET,
  corsOrigin: parsedEnv.CORS_ORIGIN,
  uploadMaxSize: parsedEnv.UPLOAD_MAX_SIZE,
  paystackSecretKey: parsedEnv.PAYSTACK_SECRET_KEY,
  paystackPublicKey: parsedEnv.PAYSTACK_PUBLIC_KEY,
  paystackWebhookSecret: parsedEnv.PAYSTACK_WEBHOOK_SECRET,
  stripeSecretKey: parsedEnv.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsedEnv.STRIPE_WEBHOOK_SECRET,
  isProduction: parsedEnv.NODE_ENV === 'production',
  isDevelopment: parsedEnv.NODE_ENV === 'development',
  isTest: parsedEnv.NODE_ENV === 'test',
};
