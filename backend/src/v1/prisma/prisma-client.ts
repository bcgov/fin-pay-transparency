import { logger } from '../../logger';
import { Prisma, PrismaClient } from '@prisma/client';

const DB_HOST = process.env.POSTGRESQL_HOST || 'localhost';
const DB_USER = process.env.POSTGRESQL_USER || 'postgres';
const DB_PWD = encodeURIComponent(
  process.env.POSTGRESQL_PASSWORD || 'postgres',
);
const DB_PORT = process.env.POSTGRESQL_PORT || 5432;
const DB_NAME = process.env.POSTGRESQL_DATABASE || 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA || 'pay_transparency';

const datasourceUrl = `postgresql://${DB_USER}:${DB_PWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}&connection_limit=5`;
logger.silly(`Connecting to ${datasourceUrl}`);
const prisma: PrismaClient<
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
prisma.$on('query', (e) => {
  logger.debug(
    `Query: ${e.query}- Params: ${e.params} - Duration: ${e.duration}ms`,
  );
});

export default prisma;
