import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

interface AdvisoryLockResult {
  pg_try_advisory_lock: boolean;
}

interface AdvisoryLockBlockingResult {
  pg_advisory_lock: null;
}

interface AdvisoryUnlockResult {
  pg_advisory_unlock: boolean;
}

type AdvisoryKey = [number, number];

/**
 * Converts a string to a 64-bit advisory lock key.
 * Uses SHA256 hash to generate two 32-bit integers.
 *
 * @param name - The lock name to convert
 * @returns A tuple of two 32-bit integers for use with PostgreSQL advisory locks
 */
function strToKey(name: string): AdvisoryKey {
  const buf = createHash('sha256').update(name).digest();
  return [buf.readInt32LE(0), buf.readInt32LE(4)];
}

/**
 * PostgreSQL advisory lock utility for distributed task coordination.
 *
 * Uses PostgreSQL's advisory locks to ensure only one process/pod can acquire
 * a lock at a time. Useful for running scheduled tasks in distributed environments.
 *
 * @example
 * ```typescript
 * const lock = new AdvisoryLock(prisma, 'daily-report-generator');
 *
 * // Non-blocking attempt
 * if (await lock.tryAcquire()) {
 *   try {
 *     // Perform your task
 *   } finally {
 *     await lock.release();
 *   }
 * }
 *
 * // Blocking wait for lock
 * await lock.acquire();
 * try {
 *   // Perform your task
 * } finally {
 *   await lock.release();
 * }
 * ```
 */
export class AdvisoryLock {
  private readonly lockKey: AdvisoryKey;
  private readonly lockName: string;
  private readonly prisma: PrismaClient;
  private isAcquired: boolean = false;

  /**
   * Creates a new AdvisoryLock instance.
   *
   * @param prisma - Prisma client instance
   * @param lockName - Unique string identifier for this lock (will be hashed to create numeric lock ID)
   * @throws {Error} If lockName is empty
   */
  constructor(prisma: PrismaClient, lockName: string) {
    if (!lockName || lockName.trim().length === 0) {
      throw new Error('lockName must be a non-empty string');
    }

    this.prisma = prisma;
    this.lockName = lockName.trim();
    this.lockKey = strToKey(this.lockName);
  }

  /**
   * Attempts to acquire the advisory lock and returns false if it couldn't do it.
   *
   * @returns Promise that resolves to true if lock was acquired, false if another process holds it
   * @throws {Error} If the lock is already acquired by this instance or if database query fails
   */
  async tryAcquire(): Promise<boolean> {
    if (this.isAcquired) {
      throw new Error(
        'Lock is already acquired by this instance. Release it before trying to acquire again.',
      );
    }

    try {
      const [key1, key2] = this.lockKey;
      const result = await this.prisma.$queryRaw<AdvisoryLockResult[]>`
        SELECT pg_try_advisory_lock(${key1}::int4, ${key2}::int4)
      `;

      if (result[0]?.pg_try_advisory_lock) {
        this.isAcquired = true;
        return true;
      }

      return false;
    } catch (error) {
      throw new Error(
        `Failed to acquire advisory lock "${this.lockName}": ${error.message}`,
      );
    }
  }

  /**
   * Acquires the advisory lock, blocking until it becomes available.
   * Uses PostgreSQL's pg_advisory_lock which will wait indefinitely until the lock is available.
   *
   * @throws {Error} If the lock is already acquired by this instance or if database query fails
   */
  async acquire(): Promise<void> {
    if (this.isAcquired) {
      throw new Error(
        'Lock is already acquired by this instance. Release it before trying to acquire again.',
      );
    }

    try {
      const [key1, key2] = this.lockKey;
      await this.prisma.$queryRaw<AdvisoryLockBlockingResult[]>`
        SELECT pg_advisory_lock(${key1}::int4, ${key2}::int4)
      `;

      this.isAcquired = true;
    } catch (error) {
      throw new Error(
        `Failed to acquire advisory lock "${this.lockName}": ${error.message}`,
      );
    }
  }

  /**
   * Releases the advisory lock.
   *
   * @throws {Error} If the lock was not acquired by this instance or if database query fails
   */
  async release(): Promise<void> {
    if (!this.isAcquired) {
      throw new Error(
        'Cannot release a lock that was not acquired by this instance',
      );
    }

    try {
      const [key1, key2] = this.lockKey;
      const result = await this.prisma.$queryRaw<AdvisoryUnlockResult[]>`
        SELECT pg_advisory_unlock(${key1}::int4, ${key2}::int4)
      `;

      this.isAcquired = false;

      if (!result[0]?.pg_advisory_unlock) {
        throw new Error(`Lock was not held by this session`);
      }
    } catch (error) {
      // Reset state even on error to prevent deadlock
      this.isAcquired = false;
      throw new Error(
        `Failed to release advisory lock "${this.lockName}": ${error.message}`,
      );
    }
  }

  /**
   * Checks if this instance currently holds the lock.
   */
  get acquired(): boolean {
    return this.isAcquired;
  }

  /**
   * Gets the lock name.
   */
  get name(): string {
    return this.lockName;
  }
}
