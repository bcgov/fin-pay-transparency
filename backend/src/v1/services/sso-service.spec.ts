import { faker } from '@faker-js/faker';
import { SSO } from './sso-service';

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();
const mockAxiosCreate = jest.fn((args) => ({
  get: () => mockAxiosGet(),
  post: (...args) => mockAxiosPost(...args),
}));
jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  post: () => mockAxiosPost(),
  create: (args) => mockAxiosCreate(args),
}));

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
    it('should get users for the PTRT-ADMIN and PTRT-USER roles', async () => {
      mockAxiosPost.mockResolvedValue({
        data: { access_token: 'jwt', token_type: 'Bearer' },
      });
      mockAxiosGet.mockResolvedValue({
        data: {
          data: [
            {
              email: faker.internet.email(),
              attributes: {
                idir_username: [faker.internet.userName()],
                display_name: [faker.internet.displayName()],
              },
            },
            {
              email: faker.internet.email(),
              attributes: {
                idir_username: [faker.internet.userName()],
                display_name: [faker.internet.displayName()],
              },
            },
          ],
        },
      });
      const client = await SSO.init();
      const users = await client.getUsers();
      expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      expect(users.every((u) => u.effectiveRole === 'PTRT-ADMIN')).toBeTruthy();
      expect(users.every((u) => u.roles.length === 2)).toBeTruthy();
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
      await client.addRolesToUser(username, [{name: 'admin'}]);
      expect(mockAxiosPost).toHaveBeenCalledTimes(2);
      const args = mockAxiosPost.mock.calls[1];
      expect(args[0]).toBe(`/users/${username}/roles`);
      expect(args[1]).toEqual([{ name: 'admin' }]);
    });
  });
});
