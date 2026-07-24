import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvisoryLock } from './advisory-lock.js';
import type { Pool } from 'pg';

let mockAdvisoryLockValue = true;

const mockQuery = vi.fn(async () => ({
  rows: [
    {
      acquired: mockAdvisoryLockValue,
      pg_advisory_unlock: mockAdvisoryLockValue,
    },
  ],
}));

const mockPgPool = {
  connect: () => ({ query: mockQuery, release: vi.fn() }),
} as unknown as Pool;

beforeEach(() => {
  vi.resetAllMocks();
  mockAdvisoryLockValue = true;
});

// ---------------------------------------------------------------------------
// constructor
// ---------------------------------------------------------------------------
describe('constructor', () => {
  it('should set name from trimmed lockName', () => {
    const lock = new AdvisoryLock(mockPgPool, '  my-lock  ');
    expect(lock.name).toBe('my-lock');
  });

  it('should throw when lockName is empty', () => {
    expect(() => new AdvisoryLock(mockPgPool, '')).toThrow(
      'lockName must be a non-empty string',
    );
  });

  it('should throw when lockName is only whitespace', () => {
    expect(() => new AdvisoryLock(mockPgPool, '   ')).toThrow(
      'lockName must be a non-empty string',
    );
  });

  it('should start with acquired = false', () => {
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');
    expect(lock.acquired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tryAcquire
// ---------------------------------------------------------------------------
describe('tryAcquire', () => {
  it('should return true and set acquired when pg_try_advisory_lock returns true', async () => {
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');

    const result = await lock.tryAcquire();

    expect(result).toBe(true);
    expect(lock.acquired).toBe(true);
  });

  it('should return false and not set acquired when pg_try_advisory_lock returns false', async () => {
    mockAdvisoryLockValue = false;
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');

    const result = await lock.tryAcquire();

    expect(result).toBe(false);
    expect(lock.acquired).toBe(false);
  });

  it('should throw if already acquired', async () => {
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');
    await lock.tryAcquire();

    await expect(lock.tryAcquire()).rejects.toThrow(
      'Lock is already acquired by this instance',
    );
  });

  it('should wrap database errors', async () => {
    mockQuery.mockImplementation(async () => {
      throw new Error('connection refused');
    });
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');

    await expect(lock.tryAcquire()).rejects.toThrow(
      'Failed to acquire advisory lock "my-lock": connection refused',
    );
  });

  it('should call required functions', async () => {
    const lock = new AdvisoryLock(mockPgPool, 'test-lock');

    await lock.tryAcquire();

    expect(mockQuery).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// release
// ---------------------------------------------------------------------------
describe('release', () => {
  it('should clear acquired after successful release', async () => {
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');
    await lock.tryAcquire();

    mockAdvisoryLockValue = true;
    await lock.release();

    expect(lock.acquired).toBe(false);
  });

  it('should throw if not acquired', async () => {
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');

    await expect(lock.release()).rejects.toThrow(
      'Cannot release a lock that was not acquired by this instance',
    );
  });

  it('should throw when pg_advisory_unlock returns false', async () => {
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');
    await lock.tryAcquire();

    mockAdvisoryLockValue = false;

    await expect(lock.release()).rejects.toThrow(
      'Failed to release advisory lock "my-lock"',
    );
  });

  it('should wrap database errors and reset acquired', async () => {
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');
    await lock.tryAcquire();

    mockQuery.mockImplementation(async () => {
      throw new Error('db down');
    });

    await expect(lock.release()).rejects.toThrow(
      'Failed to release advisory lock "my-lock": db down',
    );
    expect(lock.acquired).toBe(false);
  });

  it('should call required functions', async () => {
    const lock = new AdvisoryLock(mockPgPool, 'test-lock');
    await lock.tryAcquire();

    mockAdvisoryLockValue = true;
    await lock.release();

    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// acquired getter
// ---------------------------------------------------------------------------
describe('acquired getter', () => {
  it('should reflect lock state transitions', async () => {
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');

    expect(lock.acquired).toBe(false);
    await lock.tryAcquire();
    expect(lock.acquired).toBe(true);

    mockAdvisoryLockValue = true;
    await lock.release();
    expect(lock.acquired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// misc
// ---------------------------------------------------------------------------
describe('error printer', () => {
  it('should convert any kind of error into a string', async () => {
    class WeirdError {
      text;
      constructor(text) {
        this.text = text;
      }
    }
    mockQuery.mockRejectedValue(new WeirdError('testing error'));
    const lock = new AdvisoryLock(mockPgPool, 'my-lock');
    await expect(lock.tryAcquire()).rejects.toThrow(
      'Failed to acquire advisory lock "my-lock": Unknown error',
    );
  });
});
