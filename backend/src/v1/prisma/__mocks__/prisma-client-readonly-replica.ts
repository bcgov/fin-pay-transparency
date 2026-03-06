import { beforeEach } from 'vitest';
import { mockReset } from 'vitest-mock-extended';
import prisma from './prisma-client.js';

beforeEach(() => {
  mockReset(prisma);
  prisma.$transaction.mockImplementation((callback) => callback(prisma as any));
});

export default prisma;
