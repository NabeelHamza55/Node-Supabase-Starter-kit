import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file if it exists
dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_ANON_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['info', 'debug', 'error', 'warn']).default('info'),

  // Authentication
  ENABLE_AUTH: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  ENABLE_SOCIAL_AUTH: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  ENABLE_STORAGE: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  ENABLE_EMAIL_VERIFICATION: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),

  // Social Auth Providers (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().default('your-secret-key-change-in-production'),
  JWT_EXPIRY: z.string().default('7d'),

  // Storage
  STORAGE_BUCKET_NAME: z.string().default('user-uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'), // 5MB

  // Email Configuration (SMTP)
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM_EMAIL: z.string().email(),
  SMTP_FROM_NAME: z.string().default('Manifex API'),

  // Email Verification & Password Reset
  EMAIL_VERIFICATION_EXPIRY: z.string().transform(Number).default('86400'), // 24 hours in seconds
  PASSWORD_RESET_EXPIRY: z.string().transform(Number).default('3600'), // 1 hour in seconds
  PASSWORD_RESET_URL: z.string().url().optional(), // Frontend URL for reset link

  // API URL
  API_URL: z.string().url().optional().default('http://localhost:3000'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173').transform(v => v.split(',')),
});

const parsedConfig = configSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error('❌ Invalid environment variables:', parsedConfig.error.format());
  process.exit(1);
}

export const config = parsedConfig.data;
