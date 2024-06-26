import { run } from './run.all';

const mockStartReportLock = jest.fn();
jest.mock('./lock-reports-scheduler', () => ({
  __esModule: true,

  default: {
    start: () => mockStartReportLock(),
  },
}));

const mockDeleteUserErrorsLock = jest.fn();
jest.mock('./delete-user-errors-scheduler', () => ({
  __esModule: true,

  default: {
    start: () => mockDeleteUserErrorsLock(),
  },
}));

const mockDeleteDraftReportLock = jest.fn();
jest.mock('./delete-draft-service-scheduler', () => ({
  __esModule: true,

  default: {
    start: () => mockDeleteDraftReportLock(),
  },
}));

describe('run.all', () => {
  it('should start all jobs', async () => {
    run();
    expect(mockDeleteDraftReportLock).toHaveBeenCalled();
    expect(mockDeleteUserErrorsLock).toHaveBeenCalled();
    expect(mockStartReportLock).toHaveBeenCalled();
  });
});
