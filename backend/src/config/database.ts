import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { secrets } from './env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const connectionString = secrets.database_url;
const dbSslMode = secrets.db_ssl_mode;

const sslConfig =
  dbSslMode === 'require'
    ? { rejectUnauthorized: true }
    : dbSslMode === 'prefer'
      ? { rejectUnauthorized: false }
      : false;

const poolConfig: Record<string, unknown> = { 
  connectionString,
  ssl: sslConfig,
  connectionTimeoutMillis: 5000,
  query_timeout: 30000,
  statement_timeout: 30000,
};

const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  console.error('[DB] Pool error:', err);
});

const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;
