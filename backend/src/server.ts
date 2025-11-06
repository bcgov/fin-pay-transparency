import http from 'node:http';
import { config } from './config/index';

import { logger } from './logger';

import { AddressInfo } from 'node:net';
import { adminApp } from './admin-app';
import { app } from './app';
import { externalConsumerApp } from './external-consumer-app';
import prisma from './v1/prisma/prisma-client';
import prismaReadOnlyReplica from './v1/prisma/prisma-client-readonly-replica';

// run inside `async` function

const port = config.get('server:port');
const externalConsumerPort = config.get('server:externalConsumerPort');
const adminPort = config.get('server:adminPort');
const server = http.createServer(app);
const externalConsumerServer = http.createServer(externalConsumerApp);
const adminServer = http.createServer(adminApp);
prisma
  .$connect()
  .then(() => {
    app.set('port', port);
    logger.info('Postgres initialized');
    prismaReadOnlyReplica
      .$connect()
      .then(() => {
        logger.info('Readonly Postgres initialized');
      })
      .catch((error) => {
        logger.error(error);
        process.exit(1);
      });
    server.listen(port);
    externalConsumerServer.listen(externalConsumerPort);
    adminServer.listen(adminPort);
    server.on('error', onError);
    server.on('listening', onListening);
    externalConsumerServer.on('error', onError);
    externalConsumerServer.on('listening', onExternalConsumerListening);
    adminServer.on('error', onError);
    adminServer.on('listening', onAdminListening);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: { syscall: string; code: any }) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      break;
    default:
      throw error;
  }
}

function printToConsole(addr: AddressInfo | string) {
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  logger.info('Listening on ' + bind);
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  printToConsole(addr);
}
function onExternalConsumerListening() {
  const addr = externalConsumerServer.address();
  printToConsole(addr);
}
function onAdminListening() {
  const addr = adminServer.address();
  printToConsole(addr);
}

process.on('SIGINT', () => {
  prisma
    .$disconnect()
    .then(() => {
      prismaReadOnlyReplica
        .$disconnect()
        .then(() => {
          server.close();
          externalConsumerServer.close();
          adminServer.close();
          logger.info('process terminated by SIGINT');
          process.exit(0);
        })
        .catch((error) => {
          logger.error(error);
          process.exit(1);
        });
    })
    .catch((error) => {
      logger.error('Error while disconnecting from Prisma:', error);
      process.exit(1); // Handle the error and exit with a non-zero status code
    });
});
process.on('SIGTERM', () => {
  prisma
    .$disconnect()
    .then(() => {
      prismaReadOnlyReplica
        .$disconnect()
        .then(() => {
          server.close();
          externalConsumerServer.close();
          adminServer.close();
          logger.info('process terminated by SIGINT');
          process.exit(0);
        })
        .catch((error) => {
          logger.error(error);
          process.exit(1);
        });
    })
    .catch((error) => {
      logger.error('Error while disconnecting from Prisma:', error);
      process.exit(1); // Handle the error and exit with a non-zero status code
    });
});
// Prevent unhandled promise errors from crashing application
process.on('unhandledRejection', (err: Error) => {
  if (err?.stack) {
    logger.error(err);
  }
});
