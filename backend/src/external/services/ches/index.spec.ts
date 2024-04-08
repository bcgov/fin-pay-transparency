import emailService from './index';

jest.mock('./ches-service');

describe('emailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('should not export the emailService instance', () => {
    expect(emailService).toBeFalsy()
  });
});
