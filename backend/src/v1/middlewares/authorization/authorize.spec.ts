import { RoleType } from '../../types/users';
import { authorize as useAuthorize } from './authorize';
const mockGetSessionUser = jest.fn();
jest.mock('../../services/utils-service', () => ({
  utils: {
    getSessionUser: () => mockGetSessionUser(),
  },
}));
describe('authorize', () => {
  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockNext = jest.fn();
  const mockRequest = {} as any;
  const mockResponse = { status: mockStatus } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authorized', async () => {
    mockGetSessionUser.mockReturnValue({
      _json: { client_roles: [] },
    });
    const checkRoles: RoleType[] = ['PTRT-ADMIN'];
    const authorize = useAuthorize(checkRoles);
    await authorize(mockRequest, mockResponse, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Not authorized' });
  });

  it('should call next if user is authorized', async () => {
    mockGetSessionUser.mockReturnValue({
      _json: { client_roles: ['PTRT-ADMIN'] },
    });
    const checkRoles: RoleType[] = ['PTRT-ADMIN'];
    const authorize = useAuthorize(checkRoles);
    await authorize(mockRequest, mockResponse, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
