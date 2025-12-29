import { prisma } from '@/core/prisma';

describe('Prisma integration (real DB)', () => {
  const dbUrl = process.env.DATABASE_URL_TEST;
  if (!dbUrl) {
    it('skips: DATABASE_URL_TEST not set', () => {
      console.warn('Skipping integration: DATABASE_URL_TEST not set');
    });
    return;
  }

  it('can connect and run SELECT 1', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as one`;
    expect(result[0]?.one || result[0]?.ONE).toBe(1);
  });
});
