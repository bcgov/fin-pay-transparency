/**
 * This file is used to create a read-only replica of the prisma client.
 * This is useful to support read queries for reporting purposes needed by external teams or tools.
 * This saves load on primary database pod to server the live traffic and reduce the overhead of reporting needs.
 * extend was NOT added to the prisma client in prisma-client.ts, to make sure existing code is not affected
 */
import { logger } from '../../logger';
import { readReplicas } from '@prisma/extension-read-replicas';
import prisma from './prisma-client';

const DB_USER = process.env.POSTGRESQL_USER || 'postgres';
const DB_PWD = encodeURIComponent(
  process.env.POSTGRESQL_PASSWORD || 'postgres',
);
const DB_PORT = process.env.POSTGRESQL_PORT || 5432;
const DB_NAME = process.env.POSTGRESQL_DATABASE || 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA || 'pay_transparency';
const DB_CONNECTION_POOL_SIZE = process.env.DB_CONNECTION_POOL_SIZE || 5;
const READ_ONLY_REPLICA_HOST = process.env.READ_ONLY_REPLICA_HOST || process.env.POSTGRESQL_HOST || 'localhost';
const readReplicaUrl = `postgresql://${DB_USER}:${DB_PWD}@${READ_ONLY_REPLICA_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}&connection_limit=${DB_CONNECTION_POOL_SIZE}`;
logger.silly(`Connecting to readonly replica at ${readReplicaUrl}`);

const prismaReadOnlyReplica = prisma.$extends(
  readReplicas({
    url: readReplicaUrl
  }),
)

export default prismaReadOnlyReplica;
