import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvisoryLock } from './advisory-lock.js';

const mockQueryRaw = vi.fn();
const mockTransaction = { $queryRaw: mockQueryRaw };
const mockPrisma = {
  $transaction: vi.fn(async (callback) => callback(mockTransaction)),
};

beforeEach(() => {
  vi.resetAllMocks();
  mockQueryRaw.mockResolvedValue([{ pg_try_advisory_xact_lock: true }]);
  mockPrisma.$transaction.mockImplementation(async (callback) =>
    callback(mockTransaction),
  );
});

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
});

describe('withLock', () => {
  it('should run the callback when the transaction lock is acquired', async () => {
    const callback = vi.fn(async () => undefined);
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    const result = await lock.withLock(callback);

    expect(result).toBe(true);
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockQueryRaw).toHaveBeenCalledOnce();
    expect(mockQueryRaw.mock.calls[0][0].join('')).toContain(
      'pg_try_advisory_xact_lock',
    );
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should not run the callback when the transaction lock is unavailable', async () => {
    mockQueryRaw.mockResolvedValue([{ pg_try_advisory_xact_lock: false }]);
    const callback = vi.fn(async () => undefined);
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    const result = await lock.withLock(callback);

    expect(result).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should wrap database errors', async () => {
    mockQueryRaw.mockRejectedValue(new Error('connection refused'));
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    await expect(lock.withLock(vi.fn())).rejects.toThrow(
      'Failed to run advisory lock "my-lock": connection refused',
    );
  });

  it('should wrap callback errors', async () => {
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    await expect(
      lock.withLock(async () => {
        throw new Error('callback failed');
      }),
    ).rejects.toThrow('Failed to run advisory lock "my-lock": callback failed');
  });

  it('should report unknown errors', async () => {
    mockQueryRaw.mockRejectedValue({ text: 'testing error' });
    const lock = new AdvisoryLock(mockPrisma, 'my-lock');

    await expect(lock.withLock(vi.fn())).rejects.toThrow(
      'Failed to run advisory lock "my-lock": Unknown error',
    );
  });
});
