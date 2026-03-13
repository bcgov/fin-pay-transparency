import { logger } from '../../logger.js';
import { PrismaClient } from './generated/client.js';
import { config } from '../../config/config.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = config.get('server:databaseUrl');
logger.silly(`Connecting to ${connectionString}`);
const schema = new URL(connectionString).searchParams.get('schema');
const adapter = new PrismaPg(
  {
    connectionString: connectionString,
    max: config.get('server:databaseConnectionLimit'),
  },
  { schema },
);

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
  errorFormat: 'pretty',
  adapter,
});

prisma.$on('query', (e) => {
  logger.debug(
    `Query: ${e.query}- Params: ${e.params} - Duration: ${e.duration}ms`,
  );
});

export default prisma;
