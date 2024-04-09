import waitFor from 'wait-for-expect';

import { createJob } from './create-job';

const runnable = jest.fn();
const mock_generateHtmlEmail = jest.fn();
const mock_sendEmailWithRetry = jest.fn();

jest.mock('../v1/services/utils-service', () => ({
  utils: {
    delay: jest.fn()
  }
}));

jest.mock('../external/services/ches', () => ({
  __esModule: true,
  default: {
    generateHtmlEmail: (...args) => mock_generateHtmlEmail(...args),
    sendEmailWithRetry: (...args) => mock_sendEmailWithRetry(...args),
  },
}));

jest.mock('cron', () => ({
  CronJob: class MockCron {
    constructor(
      public expression: string,
      public cb: Function,
    ) {}
    async start() {
      return this.cb();
    }
  },
}));

jest.mock('../config', () => ({
  config: {
    get: (key: string) => {
      const settings = {
        'server:schedulerTimeZone': 'Canada/Vancouver',
        'ches:enabled': true,
        'ches:emailRecipients': 'test@payt.io',
        'server:retries:minTimeout': 0,
        'server:openshiftEnv': 'local',
        'server:hostName': 'local',
      };

      return settings[key];
    },
  },
}));

const mock_tryLock = jest.fn();
const mock_unlock = jest.fn();
const mutex = { tryLock: () => mock_tryLock() };

describe('create-job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should call the job callback', async () => {
    mock_tryLock.mockReturnValue(mock_unlock);
    createJob('* * * * *', runnable, mutex as any, {
      title: 'Error title',
      message: 'Error details',
    }).start();
    await waitFor(async () => {
      expect(mock_tryLock).toHaveBeenCalledTimes(1);
      expect(runnable).toHaveBeenCalled();
      expect(mock_unlock).toHaveBeenCalledTimes(1);
    });
  });

  it('should retry and handle error and send email', async () => {
    const error = new Error('Error Happened')
    mock_tryLock.mockReturnValue(mock_unlock);
    const fn = jest.fn(async () => {
      throw error
    })
    createJob('* * * * *', fn, mutex as any, {
      title: 'Error title',
      message: 'Error details',
    }).start();
    await waitFor(() => {
      expect(mock_tryLock).toHaveBeenCalled();
      expect(fn).toHaveBeenCalledTimes(6)
      expect(mock_generateHtmlEmail).toHaveBeenCalledWith(
        'Pay Transparency | Error title | local | local',
        'test@payt.io',
        'Error details',
        error.stack,
      );
      expect(mock_sendEmailWithRetry).toHaveBeenCalled();
      expect(mock_unlock).toHaveBeenCalled();
    });
  });
});
