import { createLogger, format, transports } from 'winston';

/**
 * Handles all the different log formats
 * https://github.com/winstonjs/winston/issues/1427#issuecomment-535297716
 * https://github.com/winstonjs/winston/issues/1427#issuecomment-583199496
 * @param {*} colors
 */
function getDomainWinstonLoggerFormat(colors = true) {
  const colorize = colors ? format.colorize() : null;
  const loggingFormats = [
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    format.errors({ stack: true }),
    colorize,
    format.printf(
      (info: {
        level: string;
        timestamp: string;
        message: string | object;
        stack: string;
        [key: symbol]: Array<object>;
      }) => {
        const {
          timestamp,
          level,
          stack,
          message, // message is the first param passed to logger
          [Symbol.for('splat')]: splat, // splat holds multiple params passed to logger after the first one
        } = info;

        const stackStr = stack ? `\n${stack}` : '';

        // Combine message and splat into one array
        const allParams = [message, ...(Array.isArray(splat) ? splat : [])];

        // Process each parameter
        const formattedParams = allParams
          .map((param) =>
            typeof param === 'string' ? param : JSON.stringify(param),
          )
          .join('\n');

        return `${timestamp} - ${level}: ${formattedParams}${stackStr}`;
      },
    ),
  ].filter(Boolean);
  return format.combine(...loggingFormats);
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'silly',
  format: getDomainWinstonLoggerFormat(true),
  transports: [new transports.Console()],
});

export { logger };
