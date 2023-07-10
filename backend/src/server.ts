const http = require('http');
const {logger} = require('./logger');
const dotenv = require('dotenv');
dotenv.config();
const {app} = require('./app');
const {AppDataSource} = require('./db/database');
const port = normalizePort(process.env.PORT || 3000);
const server = http.createServer(app);
AppDataSource.initialize().then(() => {
  app.set('port', port);
  logger.info('Postgres initialized');
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
}).catch((error) => {
  logger.info(error);
  process.exit(1);
});

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const portNumber = parseInt(val, 10);

  if (isNaN(portNumber)) {
    // named pipe
    return val;
  }

  if (portNumber >= 0) {
    // port number
    return portNumber;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ?
    'Pipe ' + port :
    'Port ' + port;

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

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
  logger.info('Listening on ' + bind);
}

process.on('SIGINT', async () => {
  await AppDataSource.destroy();
  await server.close();
  logger.info('process terminated by SIGINT');
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await AppDataSource.destroy();
  await server.close();
  logger.info('process terminated by SIGTERM');
  process.exit(0);
});
