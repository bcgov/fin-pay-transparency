import { PrismaClient } from '@prisma/client';
import { beforeEach, vi } from 'vitest';
import { DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';

beforeEach(() => {
  mockReset(prisma);
});

// prettier-ignore
const prisma = mockDeep<PrismaClient>() as unknown as DeepMockProxy<{
  [K in keyof PrismaClient]: K extends | '$queryRaw' | '$executeRaw' | '$transaction' | '$connect' | '$disconnect'
    ? PrismaClient[K] : Omit<PrismaClient[K], 'groupBy'>;
}>;

export default prisma;
