import { vi, describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { SSO } from './sso-service.js';
import type { admin_user } from '@prisma/client';
import {
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin.js';
import prisma from '../prisma/__mocks__/prisma-client.js';
import axios from 'axios';

vi.mock('axios');
const mockAxiosGet = vi.mocked(axios.get);
const mockAxiosPost = vi.mocked(axios.post);
const mockAxiosDelete = vi.mocked(axios.delete);
const mockAxiosCreate = vi.mocked(axios.create);

vi.mock('../prisma/prisma-client');
const mockFindMany = prisma.admin_user.findMany;
const mockFindUniqueOrThrow = prisma.admin_user.findUniqueOrThrow;
const mockUpdate = prisma.admin_user.update;
const mockCreateHistory = prisma.admin_user_history.create;

const mockStoreUserInfoWithHistory = vi.fn();
vi.mock(import('../services/admin-auth-service.js'), async (importOriginal) => {
  const actualAdminAuth = await importOriginal();
  return {
    ...actualAdminAuth,
    adminAuth: {
      ...actualAdminAuth.adminAuth,
      storeUserInfoWithHistory: () => mockStoreUserInfoWithHistory(),
    },
  } as unknown as typeof actualAdminAuth;
});

const mockDBAdminUsers = [
  {
    admin_user_id: faker.internet.username(),
    preferred_username: faker.internet.username(),
    display_name: faker.person.fullName(),
    assigned_roles: PTRT_ADMIN_ROLE_NAME + ',' + PTRT_USER_ROLE_NAME,
  },
  {
    admin_user_id: faker.string.uuid(),
    preferred_username: faker.internet.username(),
    display_name: faker.person.fullName(),
    assigned_roles: PTRT_USER_ROLE_NAME,
  },
] as admin_user[];

describe('sso-service', () => {
  beforeEach(() => {
    mockAxiosCreate.mockReturnThis();
  });
  it('should initialize SSO client', async () => {
    mockAxiosPost.mockResolvedValue({
      data: { access_token: 'jwt', token_type: 'Bearer' },
    });
    await SSO.init();
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);

    const { headers } = mockAxiosCreate.mock.calls[0][0];
    expect(headers).toMatchObject({ Authorization: 'Bearer jwt' });
  });

  describe('getUsers', () => {
    let client: SSO;

    beforeEach(async () => {
      mockAxiosPost.mockResolvedValue({
        data: { access_token: 'jwt', token_type: 'Bearer' },
      });

      mockFindMany.mockResolvedValue(mockDBAdminUsers);
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              email: faker.internet.email(),
              username: mockDBAdminUsers[0].preferred_username,
              attributes: {
                idir_user_guid: [faker.string.uuid()],
                idir_username: [faker.internet.username()],
                display_name: [faker.internet.displayName()],
              },
            },
            {
              email: faker.internet.email(),
              username: mockDBAdminUsers[1].preferred_username,
              attributes: {
                idir_user_guid: [faker.string.uuid()],
                idir_username: [faker.internet.username()],
                display_name: [faker.internet.displayName()],
              },
            },
          ],
        },
      });
      client = await SSO.init();
    });
    it('should get users for the PTRT-ADMIN and PTRT-USER roles and perform db updates if there is a missmatch', async () => {
      mockStoreUserInfoWithHistory.mockResolvedValue(true);
      const users = await client.getUsers();
      expect(users).toHaveLength(2);
      expect(mockAxiosGet).toHaveBeenCalledTimes(2); // called axios once for every role
      expect(mockFindMany).toHaveBeenCalledTimes(2); // called once to check if there are any difference, the second time is to get the updates
    });
    it('should throw error if SSO returns no users', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [],
        },
      });
      await expect(client.getUsers()).rejects.toThrow();
    });
    it('should not query the database twice if there were no db updates', async () => {
      mockStoreUserInfoWithHistory.mockResolvedValue(false); // Storing info returns false to signify nothing was changed in the database
      const users = await client.getUsers();
      expect(users).toHaveLength(2);
      expect(mockFindMany).toHaveBeenCalledTimes(1); // only 1 call at the beginning to get the details, nothing in the database changed, so no second call
    });
    it('should de-activate users in database that have no permissions in sso', async () => {
      mockFindMany
        .mockResolvedValueOnce([
          ...mockDBAdminUsers,
          {
            admin_user_id: faker.string.uuid(), // add a bonus user that should not be there
            preferred_username: faker.internet.username(),
          } as admin_user,
        ])
        .mockResolvedValue(mockDBAdminUsers);

      await client.getUsers();
      expect(mockUpdate).toHaveBeenCalledTimes(1); // one user is different, so update the DB once
    });
  });

  describe('getUsersForDisplay', () => {
    let client: SSO;
    beforeEach(async () => {
      mockAxiosPost.mockResolvedValue({
        data: { access_token: 'jwt', token_type: 'Bearer' },
      });
      client = await SSO.init();
    });
    it('should convert the list of users into an object for the frontend', async () => {
      vi.spyOn(client, 'getUsers').mockResolvedValueOnce(
        mockDBAdminUsers as admin_user[],
      );
      const users = await client.getUsersForDisplay();
      expect(users).toStrictEqual([
        {
          displayName: mockDBAdminUsers[0].display_name,
          effectiveRole: PTRT_ADMIN_ROLE_NAME,
          id: mockDBAdminUsers[0].admin_user_id,
        },
        {
          displayName: mockDBAdminUsers[1].display_name,
          effectiveRole: PTRT_USER_ROLE_NAME,
          id: mockDBAdminUsers[1].admin_user_id,
        },
      ]);
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
      await client.getRolesByUser(faker.internet.username());
      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
    });
  });
  describe('addRolesToUser', () => {
    it('should get roles by user', async () => {
      mockAxiosPost.mockResolvedValue({
        data: { access_token: 'jwt', token_type: 'Bearer' },
      });
      const client = await SSO.init();
      const username = faker.internet.username();
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
            idir_user_guid: faker.string.uuid(),
            display_name: faker.internet.username(),
            assigned_roles: '',
          } as admin_user);
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
            idir_user_guid: faker.string.uuid(),
            preferred_username: faker.internet.username(),
            display_name: faker.internet.username(),
            assigned_roles: 'PTRT-USER',
          } as admin_user;
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
            idir_user_guid: faker.string.uuid(),
            preferred_username: faker.internet.username(),
            display_name: faker.internet.username(),
            assigned_roles: 'PTRT-ADMIN,PTRT-USER',
          } as admin_user;
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
        const mockPost = vi.fn();
        const mockDelete = vi.fn();
        const client = new SSO({
          post: (...args) => mockPost(...args),
          delete: (...args) => mockDelete(...args),
        } as any);

        const userId = faker.string.uuid();
        const user = {
          admin_user_id: userId,
          idir_user_guid: faker.string.uuid(),
          preferred_username: faker.internet.username(),
          display_name: faker.internet.username(),
          assigned_roles: 'PTRT-ADMIN,PTRT-USER',
        } as admin_user;

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
          client.assignRoleToUser(faker.internet.username(), 'PTRT-ADMIN'),
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
            idir_user_guid: faker.string.uuid(),
            display_name: faker.internet.username(),
            assigned_roles: '',
          } as admin_user);
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
          idir_user_guid: faker.string.uuid(),
          preferred_username: faker.internet.username(),
          display_name: faker.internet.username(),
          assigned_roles: 'PTRT-ADMIN,PTRT-USER',
        } as admin_user;
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
