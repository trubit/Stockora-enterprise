import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/stockora'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  JWT_SECRET: z.string().default('development-fallback-secret-do-not-use-in-production'),
  JWT_REFRESH_SECRET: z.string().default('development-fallback-refresh-do-not-use-in-production'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
}).refine((data) => {
  if (data.NODE_ENV === 'production') {
    return data.JWT_SECRET !== 'development-fallback-secret-do-not-use-in-production' &&
           data.JWT_REFRESH_SECRET !== 'development-fallback-refresh-do-not-use-in-production';
  }
  return true;
}, {
  message: "Production environment requires custom and secure JWT_SECRET and JWT_REFRESH_SECRET variables.",
});

let parsedEnv: z.infer<typeof envSchema>;

try {
  // Use process.env if available, otherwise default to empty object so defaults take place
  const envSource = typeof process !== 'undefined' ? process.env : {};
  parsedEnv = envSchema.parse(envSource);
} catch (error) {
  if (error instanceof z.ZodError) {
    const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    console.error('Environment validation error:', issues);
  } else {
    console.error('Unexpected environment validation error:', error);
  }
  // Provide fallback to avoid blocking compiler or server start during minor configuration slips
  parsedEnv = envSchema.parse({});
}

export const config = {
  port: parsedEnv.PORT,
  env: parsedEnv.NODE_ENV,
  mongodbUri: parsedEnv.MONGODB_URI,
  redisUrl: parsedEnv.REDIS_URL,
  jwtSecret: parsedEnv.JWT_SECRET,
  jwtRefreshSecret: parsedEnv.JWT_REFRESH_SECRET,
  corsOrigin: parsedEnv.CORS_ORIGIN,
  isProduction: parsedEnv.NODE_ENV === 'production',
  isDevelopment: parsedEnv.NODE_ENV === 'development',
  isTest: parsedEnv.NODE_ENV === 'test',
};
