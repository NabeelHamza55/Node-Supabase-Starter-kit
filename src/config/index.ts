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
  LOG_LEVEL: z.enum(['info', 'debug', 'error', 'warn']).default('info'),
});

const parsedConfig = configSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error('❌ Invalid environment variables:', parsedConfig.error.format());
  process.exit(1);
}

export const config = parsedConfig.data;
