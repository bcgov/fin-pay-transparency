/**
 * This file is used to create a prisma instance with a single connection in the pool.
 * This is used to acquire an advisory lock and then release the lock on the same session.
 * This can be used by other services that require multiple queries to be executed on the same session.
 */
import { logger } from '../../logger.js';
import { PrismaClient } from './generated/client.js';
import { config } from '../../config/config.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = config.get('server:datasourceUrlSingle');
logger.silly(`Connecting to ${connectionString}`);
const schema = new URL(connectionString).searchParams.get('schema');
const adapter = new PrismaPg(
  {
    connectionString: connectionString,
    options: schema && `-c search_path="${schema}"`,
  },
  { schema },
);

const prismaSingle = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
  errorFormat: 'pretty',
  adapter,
});
prismaSingle.$on('query', (e) => {
  logger.debug(
    `Query: ${e.query}- Params: ${e.params} - Duration: ${e.duration}ms`,
  );
});

export default prismaSingle;
