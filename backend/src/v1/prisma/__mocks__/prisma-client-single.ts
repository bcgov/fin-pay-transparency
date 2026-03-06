import { PrismaClient } from '@prisma/client';
import { beforeEach } from 'vitest';
import { DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';

// prettier-ignore
const prismaSingle = mockDeep<PrismaClient>() as unknown as DeepMockProxy<{
  [K in keyof PrismaClient]: K extends | '$queryRaw' | '$executeRaw' | '$transaction' | '$connect' | '$disconnect'
    ? PrismaClient[K] : Omit<PrismaClient[K], 'groupBy'>;
}>;

beforeEach(() => {
  mockReset(prismaSingle);
  prismaSingle.$transaction.mockImplementation((callback) =>
    callback(prismaSingle as any),
  );
});

export default prismaSingle;
