import { logger } from './logger';

describe('logger', () => {
  it('should create logger instance', () => {
    expect(logger).toBeDefined();
  });

  it('should format correctly', () => {
    // No message
    const error = new Error();
    logger.error(error);

    const error2 = new Error({ message: 'With object message' } as any);
    logger.error(error2);
  });
});
