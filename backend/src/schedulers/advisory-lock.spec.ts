import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AdvisoryLock } from './advisory-lock.js';

let mockPrismaAdvisoryLockValue = true;

const mockQueryRaw = vi.fn(async () => [
  {
    pg_try_advisory_lock: mockPrismaAdvisoryLockValue,
    pg_advisory_unlock: mockPrismaAdvisoryLockValue,
  },
]);
const mockPrisma = {
  $queryRaw: mockQueryRaw,
} as unknown as PrismaClient;

beforeEach(() => {
  vi.resetAllMocks();
  mockPrismaAdvisoryLockValue = true;
});

// ---------------------------------------------------------------------------
// constructor
// ---------------------------------------------------------------------------
describe('constructor', () => {
  it('should set name from trimmed lockName', () => {
    const lock = new AdvisoryLock(mockPrisma, '  my-lock  ');
    expect(lock.name).toBe('my-lock');
  });

  it('should throw when lockName is empty', () => {
    expect(() => new AdvisoryLock(mockPrisma, '')).toThrow(
      'lockName must be a non-empty string',
    );
  });

  it('should throw when lockName is only whitespace', () => {
    expect(() => new AdvisoryLock(mockPrisma, '   ')).toThrow(
      'lockName must be a non-empty string',
    );
  });

  it('should start with acquired = false', () => {
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');
    expect(lock.acquired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tryAcquire
// ---------------------------------------------------------------------------
describe('tryAcquire', () => {
  it('should return true and set acquired when pg_try_advisory_lock returns true', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    const result = await lock.tryAcquire();

    expect(result).toBe(true);
    expect(lock.acquired).toBe(true);
  });

  it('should return false and not set acquired when pg_try_advisory_lock returns false', async () => {
    mockPrismaAdvisoryLockValue = false;
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    const result = await lock.tryAcquire();

    expect(result).toBe(false);
    expect(lock.acquired).toBe(false);
  });

  it('should throw if already acquired', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');
    await lock.tryAcquire();

    await expect(lock.tryAcquire()).rejects.toThrow(
      'Lock is already acquired by this instance',
    );
  });

  it('should wrap database errors', async () => {
    mockQueryRaw.mockImplementation(async () => {
      throw new Error('connection refused');
    });
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    await expect(lock.tryAcquire()).rejects.toThrow(
      'Failed to acquire advisory lock "my-lock": connection refused',
    );
  });

  it('should call required functions', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'test-lock');

    await lock.tryAcquire();

    expect(mockPrisma.$queryRaw).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// acquire
// ---------------------------------------------------------------------------
describe('acquire', () => {
  it('should set acquired after blocking lock succeeds', async () => {
    mockPrismaAdvisoryLockValue = null;
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    await lock.acquire();

    expect(lock.acquired).toBe(true);
  });

  it('should throw if already acquired', async () => {
    mockPrismaAdvisoryLockValue = null;
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');
    await lock.acquire();

    await expect(lock.acquire()).rejects.toThrow(
      'Lock is already acquired by this instance',
    );
  });

  it('should wrap database errors', async () => {
    mockQueryRaw.mockImplementation(async () => {
      throw new Error('timeout');
    });
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    await expect(lock.acquire()).rejects.toThrow(
      'Failed to acquire advisory lock "my-lock": timeout',
    );
  });

  it('should call required functions', async () => {
    mockPrismaAdvisoryLockValue = null;
    const lock = new AdvisoryLock(mockPrisma, 'test-lock');

    await lock.acquire();

    expect(mockPrisma.$queryRaw).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// release
// ---------------------------------------------------------------------------
describe('release', () => {
  it('should clear acquired after successful release', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');
    await lock.tryAcquire();

    mockPrismaAdvisoryLockValue = true;
    await lock.release();

    expect(lock.acquired).toBe(false);
  });

  it('should throw if not acquired', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    await expect(lock.release()).rejects.toThrow(
      'Cannot release a lock that was not acquired by this instance',
    );
  });

  it('should throw when pg_advisory_unlock returns false', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');
    await lock.tryAcquire();

    mockPrismaAdvisoryLockValue = false;

    await expect(lock.release()).rejects.toThrow(
      'Failed to release advisory lock "my-lock"',
    );
  });

  it('should wrap database errors and reset acquired', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');
    await lock.tryAcquire();

    mockQueryRaw.mockImplementation(async () => {
      throw new Error('db down');
    });

    await expect(lock.release()).rejects.toThrow(
      'Failed to release advisory lock "my-lock": db down',
    );
    expect(lock.acquired).toBe(false);
  });

  it('should call required functions', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'test-lock');
    await lock.tryAcquire();

    mockPrismaAdvisoryLockValue = true;
    await lock.release();

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// acquired getter
// ---------------------------------------------------------------------------
describe('acquired getter', () => {
  it('should reflect lock state transitions', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    expect(lock.acquired).toBe(false);
    await lock.tryAcquire();
    expect(lock.acquired).toBe(true);

    mockPrismaAdvisoryLockValue = true;
    await lock.release();
    expect(lock.acquired).toBe(false);
  });
});
