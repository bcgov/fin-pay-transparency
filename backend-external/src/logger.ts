import { createLogger, format, transports } from 'winston';

const safeStringify = (value: unknown, separator: string = '\n'): string => {
  try {
    if (typeof value === 'string') return value; // String - return as-is
    if (Array.isArray(value)) return value.join(separator); // Array - join with separator
    if (
      value ==
      null /*|| (typeof value === 'object' && Object.keys(value).length === 0)*/
    )
      return ''; // null, undefined, or empty object

    // Objects with custom toString
    if (
      typeof value === 'object' &&
      typeof value.toString === 'function' &&
      value.toString !== Object.prototype.toString
    ) {
      return value.toString();
    }

    // Regular objects - JSON stringify
    return JSON.stringify(value);
  } catch {
    // Don't throw while logging an error
    return String(value); // Fallback so at least something is logged. (BigInt, for example, will throw on json.stringify).
  }
};

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
    format.printf((info) => {
      const stackTrace = info.stack ? `\n${safeStringify(info.stack)}` : '';

      // handle single object
      if (!info.message) {
        const { level, timestamp, [Symbol.for('level')]: _, ...obj } = info;
        return `${safeStringify(timestamp)} - ${level}: ${safeStringify(obj)}${stackTrace}`;
      }
      const splat = safeStringify(info[Symbol.for('splat')], ' ');
      return `${safeStringify(info.timestamp)} - ${info.level}: ${safeStringify(info.message)} ${splat}${stackTrace}`;
    }),
  ].filter(Boolean);
  return format.combine(...loggingFormats);
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'silly',
  format: getDomainWinstonLoggerFormat(true),
  transports: [new transports.Console()],
});
export { logger };
