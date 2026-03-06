import { vi, describe, it, expect } from 'vitest';
import { RoleType } from '../../types/users.js';
import { authorize as useAuthorize } from './authorize.js';
const mockGetSessionUser = vi.fn();
vi.mock('../../services/utils-service', () => ({
  utils: {
    getSessionUser: () => mockGetSessionUser(),
  },
}));
describe('authorize', () => {
  const mockJson = vi.fn();
  const mockStatus = vi.fn(() => ({ json: mockJson }));
  const mockNext = vi.fn();
  const mockRequest = {} as any;
  const mockResponse = { status: mockStatus } as any;

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
