import { authenticateAdmin } from './authenticate-admin';

const mockGetSessionUser = jest.fn();
jest.mock('../../services/utils-service', () => ({
  utils: { getSessionUser: () => mockGetSessionUser() },
}));

const mockFindFirst = jest.fn();
jest.mock('../../prisma/prisma-client', () => ({
  admin_user: {
    findFirst: () => mockFindFirst(),
  },
}));

describe('authenticateAdmin', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    jest.clearAllMocks;
    jest.resetModules();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 401 if no session data', async () => {
    const middleware = await authenticateAdmin();
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No session data',
    });
  });

  it('should return 401 if user not authorized', async () => {
    const middleware = await authenticateAdmin();
    mockGetSessionUser.mockReturnValue({
      jwt: 'jwt',
      _json: {
        preferred_username: 'username',
      },
    });
    mockFindFirst.mockResolvedValue(null);
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User not authorized',
    });
  });

  it('should set user in req', async () => {
    const middleware = await authenticateAdmin();
    mockGetSessionUser.mockReturnValue({
      jwt: 'jwt',
      _json: {
        preferred_username: 'username',
      },
    });
    mockFindFirst.mockResolvedValue({
      admin_user_id: 1,
    });
    await middleware(req, res, next);
    expect(req.user).toEqual({
      admin_user_id: 1,
      userInfo: {
        jwt: 'jwt',
        _json: {
          preferred_username: 'username',
        },
      },
    });
    expect(next).toHaveBeenCalled();
  });

  describe('strict is false', () => {
    it('should not set req.user if no session data', async () => {
      const middleware = await authenticateAdmin(false);
      mockGetSessionUser.mockReturnValue({});
      mockFindFirst.mockResolvedValue({
        admin_user_id: 1,
      });
      await middleware(req, res, next);
      expect(req.user).toBeFalsy();
      expect(next).toHaveBeenCalled();
    });

    it('should not set req.user.admin_user_id if not in admin table', async () => {
      const middleware = await authenticateAdmin(false);
      mockGetSessionUser.mockReturnValue({
        jwt: 'jwt',
        _json: {
          preferred_username: 'username',
        },
      });
      mockFindFirst.mockResolvedValue(null);
      await middleware(req, res, next);
      expect(req.user?.admin_user_id).toBeFalsy();
      expect(next).toHaveBeenCalled();
    });
  });
});
