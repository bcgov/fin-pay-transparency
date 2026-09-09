import { createHash } from 'node:crypto';
import type { PrismaClient } from '../v1/prisma/generated/client.js';

interface AdvisoryLockResult {
  pg_try_advisory_xact_lock: boolean;
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
 * The callback runs inside the transaction that owns the lock. The lock is
 * released automatically when the callback completes or throws.
 */
export class AdvisoryLock {
  private readonly lockKey: AdvisoryKey;
  private readonly lockName: string;
  private readonly prisma: PrismaClient;

  /**
   * Creates a new AdvisoryLock instance.
   *
   * @param prisma - Prisma client to use for the transaction
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
   * Attempts to acquire the transaction-scoped advisory lock.
   *
   * @returns Promise that resolves to true if the callback ran, false if another process holds the lock
   * @throws {Error} If the database query or callback fails
   */
  async withLock(callback: () => Promise<void>): Promise<boolean> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const result = await tx.$queryRaw<AdvisoryLockResult[]>`
          SELECT pg_try_advisory_xact_lock(${this.lockKey[0]}::int4, ${this.lockKey[1]}::int4)
        `;

        if (!result[0]?.pg_try_advisory_xact_lock) {
          return false;
        }

        await callback();
        return true;
      });
    } catch (error) {
      throw new Error(
        `Failed to run advisory lock "${this.lockName}": ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Gets the lock name.
   */
  get name(): string {
    return this.lockName;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
