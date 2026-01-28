import emailService from './ches';

jest.mock('./ches-service');

describe('emailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not export the emailService instance', () => {
    expect(emailService).toBeFalsy();
  });
});
