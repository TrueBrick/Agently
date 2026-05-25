import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null;
};

const hasDbUrl = !!process.env.DATABASE_URL;

let prismaInstance: PrismaClient | null = null;

if (hasDbUrl) {
  try {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient({ adapter });
  } catch (error) {
    console.error('Erro ao inicializar o PrismaClient com pg adapter:', error);
  }
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}
