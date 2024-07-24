import { faker } from '@faker-js/faker';
import { SSO } from './sso-service';

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();
const mockAxiosDelete = jest.fn();
const mockAxiosCreate = jest.fn((args) => ({
  get: () => mockAxiosGet(),
  post: (...args) => mockAxiosPost(...args),
  delete: (...args) => mockAxiosDelete(...args),
}));
jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  post: () => mockAxiosPost(),
  create: (args) => mockAxiosCreate(args),
}));

const mockFindMany = jest.fn();
const mockFindUniqueOrThrow = jest.fn();
const mockUpdate = jest.fn();
const mockCreateHistory = jest.fn();
const mockPrisma = {
  admin_user: {
    findUniqueOrThrow: (...args) => {
      return mockFindUniqueOrThrow(...args);
    },
    update: (...args) => mockUpdate(...args),
    findMany: (...args) => mockFindMany(...args),
  },
  admin_user_history: {
    create: (...args) => mockCreateHistory(...args),
  },
};

jest.mock('../prisma/prisma-client', () => ({
  admin_user: {
    findMany: (...args) => mockFindMany(...args),
    findUniqueOrThrow: (...args) => {
      return mockFindUniqueOrThrow(...args);
    },
  },
  $transaction: jest.fn().mockImplementation((fn) => fn(mockPrisma)),
}));

const mockStoreUserInfoWithHistory = jest.fn();
jest.mock('../services/admin-auth-service', () => {
  const actualAdminAuth = jest.requireActual(
    '../services/admin-auth-service',
  ) as any;
  const mockedAdminAuth = jest.createMockFromModule(
    '../services/admin-auth-service',
  ) as any;

  const mocked = {
    ...mockedAdminAuth,
    adminAuth: { ...actualAdminAuth.adminAuth },
  };

  mocked.adminAuth.storeUserInfoWithHistory = () =>
    mockStoreUserInfoWithHistory();

  return mocked;
});

describe('sso-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should initialize SSO client', async () => {
    mockAxiosPost.mockResolvedValue({
      data: { access_token: 'jwt', token_type: 'Bearer' },
    });
    await SSO.init();
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);

    const { headers } = mockAxiosCreate.mock.calls[0][0];

    expect(headers.Authorization).toBe('Bearer jwt');
  });

  describe('getUsers', () => {
    const preferredUsername1 = faker.internet.userName();
    const preferredUsername2 = faker.internet.userName();

    beforeEach(() => {
      mockAxiosPost.mockResolvedValue({
        data: { access_token: 'jwt', token_type: 'Bearer' },
      });

      mockFindMany.mockResolvedValue([
        {
          admin_user_id: faker.string.uuid(),
          preferred_username: preferredUsername1,
        },
        {
          admin_user_id: faker.string.uuid(),
          preferred_username: preferredUsername2,
        },
      ]);
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              email: faker.internet.email(),
              username: preferredUsername1,
              attributes: {
                idir_user_guid: [faker.string.uuid()],
                idir_username: [faker.internet.userName()],
                display_name: [faker.internet.displayName()],
              },
            },
            {
              email: faker.internet.email(),
              username: preferredUsername2,
              attributes: {
                idir_user_guid: [faker.string.uuid()],
                idir_username: [faker.internet.userName()],
                display_name: [faker.internet.displayName()],
              },
            },
          ],
        },
      });
    });
    it('should get users for the PTRT-ADMIN and PTRT-USER roles', async () => {
      mockStoreUserInfoWithHistory.mockResolvedValue(true);
      const client = await SSO.init();
      const users = await client.getUsers();
      expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      expect(users.every((u) => u.effectiveRole === 'PTRT-ADMIN')).toBeTruthy();
      expect(users.every((u) => u.roles.length === 2)).toBeTruthy();
      expect(mockFindMany).toHaveBeenCalledTimes(2);
    });
    it('should throw error if SSO returns no users', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [],
        },
      });
      const client = await SSO.init();
      await expect(client.getUsers()).rejects.toThrow();
    });
    it('should not query the database twice if there were no db updates', async () => {
      mockStoreUserInfoWithHistory.mockResolvedValue(false);
      const client = await SSO.init();
      const users = await client.getUsers();
      expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      expect(users.every((u) => u.effectiveRole === 'PTRT-ADMIN')).toBeTruthy();
      expect(users.every((u) => u.roles.length === 2)).toBeTruthy();
      expect(mockFindMany).toHaveBeenCalledTimes(1);
    });
    it('should de-activate users in database that have no permissions in sso', async () => {
      mockFindMany
        .mockResolvedValueOnce([
          {
            admin_user_id: faker.string.uuid(),
            preferred_username: preferredUsername1,
          },
          {
            admin_user_id: faker.string.uuid(),
            preferred_username: preferredUsername2,
          },
          {
            admin_user_id: faker.string.uuid(),
            preferred_username: faker.internet.userName(),
          },
        ])
        .mockResolvedValue([
          {
            admin_user_id: faker.string.uuid(),
            preferred_username: preferredUsername1,
          },
          {
            admin_user_id: faker.string.uuid(),
            preferred_username: preferredUsername2,
          },
        ]);

      const client = await SSO.init();
      await client.getUsers();
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRolesByUser', () => {
    it('should get roles by user', async () => {
      mockAxiosPost.mockResolvedValue({
        data: { access_token: 'jwt', token_type: 'Bearer' },
      });
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [],
        },
      });
      const client = await SSO.init();
      await client.getRolesByUser(faker.internet.userName());
      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
    });
  });
  describe('addRolesToUser', () => {
    it('should get roles by user', async () => {
      mockAxiosPost.mockResolvedValue({
        data: { access_token: 'jwt', token_type: 'Bearer' },
      });
      const client = await SSO.init();
      const username = faker.internet.userName();
      await client.addRolesToUser(username, [{ name: 'admin' }]);
      expect(mockAxiosPost).toHaveBeenCalledTimes(2);
      const args = mockAxiosPost.mock.calls[1];
      expect(args[0]).toBe(`/users/${username}/roles`);
      expect(args[1]).toEqual([{ name: 'admin' }]);
    });
  });

  describe('assignRoleToUser', () => {
    let client: SSO;
    beforeEach(async () => {
      mockAxiosPost.mockResolvedValue({
        data: { access_token: 'jwt', token_type: 'Bearer' },
      });
      client = await SSO.init();
    });
    describe('user is available', () => {
      describe('username is not set', () => {
        it('should throw an error', async () => {
          mockFindUniqueOrThrow.mockResolvedValue({
            idirUserGuid: faker.string.uuid(),
            displayName: faker.internet.userName(),
            assigned_roles: [],
          });
          const userId = faker.string.uuid();
          await expect(
            client.assignRoleToUser(userId, 'PTRT-ADMIN'),
          ).rejects.toThrow(
            `User not found with id: ${userId}. User name is missing.`,
          );
        });
      });

      describe('assign PTRT_ADMIN role', () => {
        it('should assign role to user', async () => {
          const userId = faker.string.uuid();
          const user = {
            admin_user_id: userId,
            idirUserGuid: faker.string.uuid(),
            preferred_username: faker.internet.userName(),
            displayName: faker.internet.userName(),
            assigned_roles: 'PTRT-USER',
          };
          mockFindUniqueOrThrow.mockResolvedValue(user);
          await client.assignRoleToUser(userId, 'PTRT-ADMIN');
          expect(mockAxiosDelete).not.toHaveBeenCalled();
          expect(mockAxiosPost).toHaveBeenCalledWith(
            `/users/${user.preferred_username}/roles`,
            [{ name: 'PTRT-ADMIN' }],
          );
          expect(mockUpdate).toHaveBeenCalledWith({
            where: { admin_user_id: userId },
            data: { assigned_roles: 'PTRT-ADMIN,PTRT-USER' },
          });
          expect(mockCreateHistory).toHaveBeenCalledTimes(1);
        });
      });
      describe('assign PTRT_USER role', () => {
        it('should assign role to user', async () => {
          const userId = faker.string.uuid();
          const user = {
            admin_user_id: userId,
            idirUserGuid: faker.string.uuid(),
            preferred_username: faker.internet.userName(),
            displayName: faker.internet.userName(),
            assigned_roles: 'PTRT-ADMIN,PTRT-USER',
          };
          mockFindUniqueOrThrow.mockResolvedValue(user);
          await client.assignRoleToUser(userId, 'PTRT-USER');
          expect(mockAxiosDelete).toHaveBeenCalledWith(
            `/users/${user.preferred_username}/roles/PTRT-ADMIN`,
          );
          expect(mockAxiosPost).not.toHaveBeenCalledWith(
            `/users/${user.preferred_username}/roles`,
            [{ name: 'PTRT-USER' }],
          );
          expect(mockUpdate).toHaveBeenCalledWith({
            data: { assigned_roles: 'PTRT-USER' },
            where: { admin_user_id: userId },
          });
          expect(mockCreateHistory).toHaveBeenCalledTimes(1);
        });
      });

      it('should rollback changes if an error occurs', async () => {
        mockUpdate.mockImplementationOnce(() => {
          throw new Error('User update failed');
        });
        const mockPost = jest.fn();
        const mockDelete = jest.fn();
        const client = new SSO({
          post: (...args) => mockPost(...args),
          delete: (...args) => mockDelete(...args),
        } as any);

        const userId = faker.string.uuid();
        const user = {
          admin_user_id: userId,
          idirUserGuid: faker.string.uuid(),
          preferred_username: faker.internet.userName(),
          displayName: faker.internet.userName(),
          assigned_roles: 'PTRT-ADMIN,PTRT-USER',
        };

        mockFindUniqueOrThrow.mockResolvedValue(user);
        await expect(
          client.assignRoleToUser(userId, 'PTRT-USER'),
        ).rejects.toThrow();
        expect(mockDelete).toHaveBeenCalledWith(
          `/users/${user.preferred_username}/roles/PTRT-ADMIN`,
        );
        // Post should once to rollback the changes
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith(
          `/users/${user.preferred_username}/roles`,
          [{ name: 'PTRT-ADMIN' }],
        );
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { admin_user_id: userId },
          data: { assigned_roles: 'PTRT-USER' },
        });
        expect(mockCreateHistory).toHaveBeenCalledTimes(0);
      });
    });
    describe('user is not available', () => {
      it('should throw an error', async () => {
        mockFindUniqueOrThrow.mockImplementation(() => {
          throw new Error('User not found');
        });
        await expect(
          client.assignRoleToUser(faker.internet.userName(), 'PTRT-ADMIN'),
        ).rejects.toThrow();
      });
    });
  });

  describe('deleteUser', () => {
    let client: SSO;
    beforeEach(async () => {
      mockAxiosPost.mockResolvedValue({
        data: { access_token: 'jwt', token_type: 'Bearer' },
      });
      client = await SSO.init();
    });
    describe('user is not available', () => {
      it('should throw an error', async () => {
        mockFindUniqueOrThrow.mockImplementation(() => {
          throw new Error('User not found');
        });
        await expect(
          client.deleteUser(faker.string.uuid(), faker.string.uuid()),
        ).rejects.toThrow();
      });
    });

    describe('user is available', () => {
      describe('username is not set', () => {
        it('should throw an error', async () => {
          mockFindUniqueOrThrow.mockResolvedValue({
            idirUserGuid: faker.string.uuid(),
            displayName: faker.internet.userName(),
            assigned_roles: [],
          });
          const userId = faker.string.uuid();
          await expect(
            client.deleteUser(userId, faker.string.uuid()),
          ).rejects.toThrow(
            `User not found with id: ${userId}. User name is missing.`,
          );
        });
      });

      it('should delete user', async () => {
        mockUpdate.mockClear();
        const userId = faker.string.uuid();
        const modifiedByUserId = faker.string.uuid();
        const user = {
          admin_user_id: userId,
          idirUserGuid: faker.string.uuid(),
          preferred_username: faker.internet.userName(),
          displayName: faker.internet.userName(),
          assigned_roles: 'PTRT-ADMIN,PTRT-USER',
        };
        mockFindUniqueOrThrow.mockResolvedValue(user);
        await client.deleteUser(userId, modifiedByUserId);
        expect(mockAxiosDelete).toHaveBeenCalledTimes(2);
        expect(mockAxiosDelete).toHaveBeenCalledWith(
          `/users/${user.preferred_username}/roles/PTRT-ADMIN`,
        );
        expect(mockAxiosDelete).toHaveBeenCalledWith(
          `/users/${user.preferred_username}/roles/PTRT-USER`,
        );
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { admin_user_id: userId },
          data: expect.objectContaining({
            is_active: false,
            update_user: modifiedByUserId,
          }),
        });
        expect(mockCreateHistory).toHaveBeenCalledTimes(1);
      });
    });
  });
});
