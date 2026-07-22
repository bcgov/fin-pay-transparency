import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';

interface AdvisoryLockResult {
  acquired: boolean;
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
 * const lock = new AdvisoryLock(pgPool, 'daily-report-generator');
 *
 * // Non-blocking attempt
 * if (await lock.tryAcquire()) {
 *   try {
 *     // Perform your task
 *   } finally {
 *     await lock.release();
 *   }
 * }
 * ```
 */
export class AdvisoryLock {
  private readonly lockKey: AdvisoryKey;
  private readonly lockName: string;
  private readonly pgPool: Pool;
  private pgClient: PoolClient | undefined;
  private isAcquired: boolean = false;

  /**
   * Creates a new AdvisoryLock instance.
   *
   * @param pgPool - Pool to get connections from
   * @param lockName - Unique string identifier for this lock (will be hashed to create numeric lock ID)
   * @throws {Error} If lockName is empty
   */
  constructor(pgPool: Pool, lockName: string) {
    if (!lockName || lockName.trim().length === 0) {
      throw new Error('lockName must be a non-empty string');
    }

    this.pgPool = pgPool;
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
    if (this.isAcquired || !!this.pgClient) {
      throw new Error(
        'Lock is already acquired by this instance. Release it before trying to acquire again.',
      );
    }

    try {
      this.pgClient = await this.pgPool.connect();

      const result = await this.pgClient.query<AdvisoryLockResult>(
        `SELECT pg_try_advisory_lock($1::int4, $2::int4) AS acquired`,
        this.lockKey,
      );

      this.isAcquired = result.rows[0]?.acquired ?? false;

      if (!this.isAcquired) {
        this.terminate();
      }

      return this.isAcquired;
    } catch (error) {
      this.terminate();
      throw new Error(
        `Failed to acquire advisory lock "${this.lockName}": ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Releases the advisory lock.
   * @throws {Error} If the lock was not acquired by this instance or if database query fails
   */
  async release(): Promise<void> {
    if (!this.isAcquired || !this.pgClient) {
      throw new Error(
        'Cannot release a lock that was not acquired by this instance',
      );
    }

    try {
      const result = await this.pgClient.query<AdvisoryUnlockResult>(
        'SELECT pg_advisory_unlock($1::int4, $2::int4)',
        this.lockKey,
      );

      if (!result.rows[0]?.pg_advisory_unlock) {
        throw new Error('Lock was not found in this session');
      }

      this.isAcquired = false;
      this.pgClient.release(); // return connection to pool
      this.pgClient = undefined;
    } catch (error) {
      // if error, terminate the connection
      this.terminate();
      throw new Error(
        `Failed to release advisory lock "${this.lockName}": ${this.getErrorMessage(error)}`,
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

  /**
   * If there was an error while managing the lock, it is best to
   * close the connection instead of returning it to the pool.
   */
  private terminate(): void {
    this.pgClient?.release(true); //`true` will force the connection to close instead of return to the pool.
    this.pgClient = undefined;
    this.isAcquired = false;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
