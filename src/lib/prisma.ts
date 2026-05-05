import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ 
  adapter,
  log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
