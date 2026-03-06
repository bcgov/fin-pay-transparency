/**
 * This file is used to create a prisma instance with a single connection in the pool.
 * This is used to acquire an advisory lock and then release the lock on the same session.
 * This can be used by other services that require multiple queries to be executed on the same session.
 */
import { logger } from '../../logger.js';
import { Prisma, PrismaClient } from '@prisma/client';
import { config } from '../../config/config.js';

const datasourceUrl = config.get('server:datasourceUrlSingle');
logger.silly(`Connecting to ${datasourceUrl}`);

const prismaSingle: PrismaClient<
  Prisma.PrismaClientOptions,
  'query' | 'info' | 'warn' | 'error'
> = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
  errorFormat: 'pretty',
  datasourceUrl: datasourceUrl,
});
prismaSingle.$on('query', (e) => {
  logger.debug(
    `Query: ${e.query}- Params: ${e.params} - Duration: ${e.duration}ms`,
  );
});

export default prismaSingle;
