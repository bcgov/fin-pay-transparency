import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CronJob } from 'cron';
import retry from 'async-retry';
import { logger as log } from '../logger.js';
import { config } from '../config/config.js';
import emailService from '../external/services/ches/ches.js';
import { utils } from '../v1/services/utils-service.js';
import { AdvisoryLock } from './advisory-lock.js';
import { runJobs, type JobConfig } from './jobs.js';

vi.mock('./advisory-lock.js', () => ({
  AdvisoryLock: vi.fn(function () {
    return {
      tryAcquire: vi.fn(async () => true),
      release: vi.fn(async () => undefined),
    };
  }),
}));

vi.mock('cron', () => ({
  CronJob: vi.fn(function (cronTime: string, onTick: () => Promise<void>) {
    this.cronTime = cronTime;
    this.onTick = onTick;
    this.start = vi.fn();
  }),
}));

vi.mock('async-retry', () => ({
  default: vi.fn(async (fn: () => Promise<void>) => fn()),
}));

vi.mock('../logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../config/config.js', () => ({
  config: {
    get: vi.fn((key: string) => {
      const values: Record<string, unknown> = {
        'server:schedulerDeleteDraftCronTime': '0 0 * * *',
        'server:userErrorLogging:deleteScheduleCronTime': '0 1 * * *',
        'server:schedulerLockReportCronTime': '0 2 * * *',
        'server:schedulerExpireAnnouncementsCronTime': '0 3 * * *',
        'server:emailExpiringAnnouncementsCronTime': '0 4 * * *',
        'server:deleteAnnouncementsCronTime': '0 5 * * *',
        'server:schedulerTimeZone': 'America/Vancouver',
        'server:retries:minTimeout': 1000,
        'ches:enabled': false,
        'server:openshiftEnv': 'test',
        'server:hostName': 'localhost',
        'ches:emailRecipients': 'test@example.com',
      };
      return values[key] ?? null;
    }),
  },
}));

vi.mock('../v1/services/announcements-service.js', () => ({
  announcementService: {
    expireAnnouncements: vi.fn(async () => undefined),
    deleteAnnouncementsSchedule: vi.fn(async () => undefined),
  },
}));

vi.mock('../v1/services/scheduler-service.js', () => ({
  schedulerService: {
    deleteDraftReports: vi.fn(async () => undefined),
    deleteUserErrors: vi.fn(async () => undefined),
    lockReports: vi.fn(async () => undefined),
    sendAnnouncementExpiringEmails: vi.fn(async () => undefined),
  },
}));

vi.mock('../external/services/ches/ches.js', () => ({
  default: {
    generateHtmlEmail: vi.fn(() => ({ subject: 'test', body: 'test' })),
    sendEmailWithRetry: vi.fn(async () => undefined),
  },
}));

vi.mock('../v1/services/utils-service.js', () => ({
  utils: {
    delay: vi.fn(async () => undefined),
  },
}));

vi.mock('../v1/prisma/prisma-client.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the most recently constructed CronJob mock instance. */
function lastCronJob(): any {
  return vi.mocked(CronJob).mock.instances.at(-1);
}

/** Builds a minimal JobConfig. */
function makeJobConfig(overrides: Partial<JobConfig> = {}): JobConfig {
  return {
    name: 'TestJob',
    cronTime: '0 0 * * *',
    callback: vi.fn(async () => undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// createJob (tested via runJobs)
// ---------------------------------------------------------------------------

describe('createJob', () => {
  it('should create a CronJob when cronTime is provided', () => {
    runJobs([makeJobConfig({ cronTime: '0 0 * * *' })]);

    expect(CronJob).toHaveBeenCalledOnce();
  });

  it('should not create a CronJob when cronTime is empty string', () => {
    runJobs([makeJobConfig({ cronTime: '' })]);

    expect(CronJob).not.toHaveBeenCalled();
  });

  it('should pass cronTime and timezone to CronJob', () => {
    runJobs([makeJobConfig({ cronTime: '0 6 * * *' })]);

    expect(CronJob).toHaveBeenCalledWith(
      '0 6 * * *',
      expect.any(Function),
      null,
      true,
      'America/Vancouver',
    );
  });

  describe('onTick', () => {
    it('should try to acquire the advisory lock', async () => {
      const jobConfig = makeJobConfig();
      runJobs([jobConfig]);
      const { onTick } = lastCronJob();

      await onTick();

      expect(AdvisoryLock).toHaveBeenCalledWith(
        expect.anything(),
        jobConfig.name,
      );
      const lockInstance = vi.mocked(AdvisoryLock).mock.results[0].value;
      expect(lockInstance.tryAcquire).toHaveBeenCalledOnce();
    });

    it('should call retry with the callback when lock is acquired', async () => {
      const callback = vi.fn(async () => undefined);
      runJobs([makeJobConfig({ callback })]);
      const { onTick } = lastCronJob();

      await onTick();

      expect(retry).toHaveBeenCalledOnce();
      // retry calls our fn — verify callback was ultimately invoked
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should not call the callback when lock is not acquired', async () => {
      const callback = vi.fn(async () => undefined);
      vi.mocked(AdvisoryLock).mockImplementationOnce(function () {
        return {
          tryAcquire: vi.fn(async () => false),
          release: vi.fn(async () => undefined),
        };
      });
      runJobs([makeJobConfig({ callback })]);
      const { onTick } = lastCronJob();

      await onTick();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should always call delay and release in finally', async () => {
      runJobs([makeJobConfig()]);
      const { onTick } = lastCronJob();

      await onTick();

      expect(utils.delay).toHaveBeenCalledWith(10000);
      const lockInstance = vi.mocked(AdvisoryLock).mock.results[0].value;
      expect(lockInstance.release).toHaveBeenCalledOnce();
    });

    it('should call delay and release even when callback throws', async () => {
      const callback = vi.fn(async () => {
        throw new Error('callback error');
      });
      // Make retry rethrow so the error propagates to the catch block
      vi.mocked(retry).mockImplementationOnce(async (fn: () => Promise<void>) =>
        fn(),
      );
      runJobs([makeJobConfig({ callback })]);
      const { onTick } = lastCronJob();

      await onTick();

      expect(utils.delay).toHaveBeenCalledWith(10000);
      const lockInstance = vi.mocked(AdvisoryLock).mock.results[0].value;
      expect(lockInstance.release).toHaveBeenCalledOnce();
    });

    it('should log error when callback throws', async () => {
      const err = new Error('boom');
      vi.mocked(retry).mockImplementationOnce(async (fn: () => Promise<void>) =>
        fn(),
      );
      runJobs([
        makeJobConfig({
          name: 'FailJob',
          callback: vi.fn(async () => {
            throw err;
          }),
        }),
      ]);
      const { onTick } = lastCronJob();

      await onTick();

      expect(log.error).toHaveBeenCalledWith('FailJob failed.');
      expect(log.error).toHaveBeenCalledWith(err);
    });

    it('should send an error email when ches is enabled and callback throws', async () => {
      vi.mocked(config.get).mockImplementation((key: string) => {
        if (key === 'ches:enabled') return true;
        if (key === 'server:openshiftEnv') return 'prod';
        if (key === 'server:hostName') return 'myhost';
        if (key === 'ches:emailRecipients') return 'admin@example.com';
        if (key === 'server:retries:minTimeout') return 1000;
        if (key === 'server:schedulerTimeZone') return 'America/Vancouver';
        return '0 0 * * *';
      });
      const err = new Error('bad');
      err.stack = 'Error: bad\n  at ...';
      vi.mocked(retry).mockImplementationOnce(async (fn: () => Promise<void>) =>
        fn(),
      );
      runJobs([
        makeJobConfig({
          name: 'EmailJob',
          callback: vi.fn(async () => {
            throw err;
          }),
        }),
      ]);
      const { onTick } = lastCronJob();

      await onTick();

      expect(emailService.generateHtmlEmail).toHaveBeenCalledOnce();
      expect(emailService.sendEmailWithRetry).toHaveBeenCalledOnce();
    });

    it('should not send an error email when ches is disabled and callback throws', async () => {
      vi.mocked(retry).mockImplementationOnce(async (fn: () => Promise<void>) =>
        fn(),
      );
      runJobs([
        makeJobConfig({
          callback: vi.fn(async () => {
            throw new Error('fail');
          }),
        }),
      ]);
      const { onTick } = lastCronJob();

      await onTick();

      expect(emailService.sendEmailWithRetry).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// runJobs
// ---------------------------------------------------------------------------

describe('runJobs', () => {
  it('should create and start a job for each config with a cronTime', () => {
    const configs: JobConfig[] = [
      makeJobConfig({ name: 'Job1', cronTime: '0 1 * * *' }),
      makeJobConfig({ name: 'Job2', cronTime: '0 2 * * *' }),
    ];

    runJobs(configs);

    expect(CronJob).toHaveBeenCalledTimes(2);
    const instances = vi.mocked(CronJob).mock.instances;
    expect(instances[0].start).toHaveBeenCalledOnce();
    expect(instances[1].start).toHaveBeenCalledOnce();
  });

  it('should skip jobs where cronTime is empty and still start the rest', () => {
    const configs: JobConfig[] = [
      makeJobConfig({ name: 'Disabled', cronTime: '' }),
      makeJobConfig({ name: 'Enabled', cronTime: '0 2 * * *' }),
    ];

    runJobs(configs);

    expect(CronJob).toHaveBeenCalledOnce();
    const instance = vi.mocked(CronJob).mock.instances[0];
    expect(instance.start).toHaveBeenCalledOnce();
  });

  it('should log error if an exception is thrown during job setup', () => {
    vi.mocked(CronJob).mockImplementationOnce(() => {
      throw new Error('cron init error');
    });

    runJobs([makeJobConfig()]);

    expect(log.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should call required functions', () => {
    const configs: JobConfig[] = [
      makeJobConfig({ name: 'A', cronTime: '0 0 * * *' }),
      makeJobConfig({ name: 'B', cronTime: '' }),
    ];

    runJobs(configs);

    // CronJob constructed only for the one with a cronTime
    expect(CronJob).toHaveBeenCalledOnce();
    // The created job's start() was called
    const instance = vi.mocked(CronJob).mock.instances[0];
    expect(instance.start).toHaveBeenCalledOnce();
    // The disabled job did not trigger CronJob or start
    expect(CronJob).toHaveBeenCalledTimes(1);
  });
});
