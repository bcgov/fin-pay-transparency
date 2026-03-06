/**
 * This file is used to create a read-only replica of the prisma client.
 * This is useful to support read queries for reporting purposes needed by external teams or tools.
 * This saves load on primary database pod to server the live traffic and reduce the overhead of reporting needs.
 * extend was NOT added to the prisma client in prisma-client.ts, to make sure existing code is not affected
 */
import { logger } from '../../logger.js';
import { readReplicas } from '@prisma/extension-read-replicas';
import prisma from './prisma-client.js';
import { config } from '../../config/config.js';

const readReplicaUrl = config.get('server:datasourceUrlReplica');
logger.silly(`Connecting to readonly replica at ${readReplicaUrl}`);

const prismaReadOnlyReplica = prisma.$extends(
  readReplicas({
    url: readReplicaUrl,
  }),
);

export default prismaReadOnlyReplica;
