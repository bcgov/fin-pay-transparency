import {logger} from "../../logger";

let prisma: PrismaClient;
import {PrismaClient} from '@prisma/client';

const DB_HOST = process.env.POSTGRESQL_HOST || 'localhost';
const DB_USER = process.env.POSTGRESQL_USER || 'postgres';
const DB_PWD = encodeURIComponent(process.env.POSTGRESQL_PASSWORD || 'postgres');
const DB_PORT = process.env.POSTGRESQL_PORT || 5432;
const DB_NAME = process.env.POSTGRESQL_DATABASE || 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA || 'pay_transparency';
if (!prisma) {
  const datasourceUrl = `postgresql://${DB_USER}:${DB_PWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}&connection_limit=5`;
  logger.silly(`Connecting to ${datasourceUrl}`);
  prisma = new PrismaClient({
    log: ['query', 'info', "error", "warn"],
    errorFormat: 'pretty',
    datasourceUrl: datasourceUrl
  });
  // @ts-expect-error, this is a prisma thing.
  prisma.$on('query', (e) => {
    // @ts-expect-error, this is a prisma thing.
    logger.info(`Params: ${e.params} \n Duration: ${e.duration}ms`);
  });
}

export default prisma;
