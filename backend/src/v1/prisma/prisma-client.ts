let prisma: PrismaClient;
import {PrismaClient} from '@prisma/client';

const DB_HOST = process.env.POSTGRESQL_HOST || 'localhost';
const DB_USER = process.env.POSTGRESQL_USER || 'postgres';
const DB_PWD = encodeURI(process.env.POSTGRESQL_PASSWORD || 'postgres');
const DB_PORT = process.env.POSTGRESQL_PORT || 5432;
const DB_NAME = process.env.POSTGRESQL_DATABASE || 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA || 'pay_transparency';
const PG_BOUNCER_ENABLED = process.env.PG_BOUNCER_ENABLED || 'false';
if (!prisma) {
  let datasourceUrl = `postgresql://${DB_USER}:${DB_PWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}`;
  if(PG_BOUNCER_ENABLED === 'true') {
    datasourceUrl += '&pgbouncer=true';
  }else{
    datasourceUrl += '&connection_limit=5';
  }
  prisma = new PrismaClient({
    log: ['query', 'info', "error", "warn"],
    errorFormat: 'pretty',
    datasourceUrl: datasourceUrl
  });
}

export default prisma;
