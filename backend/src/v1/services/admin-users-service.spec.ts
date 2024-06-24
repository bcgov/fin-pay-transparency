import { faker } from '@faker-js/faker';
import { SSO } from './admin-users-services';

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();
const mockAxiosCreate = jest.fn((args) => ({
  get: () => mockAxiosGet(),
}));
jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  post: () => mockAxiosPost(),
  create: (args) => mockAxiosCreate(args),
}));

describe('admin-users-service', () => {
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
          ],
        },
      });
      const client = await SSO.init();
      const users = await client.getUsers();
      expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      expect(users.some((u) => u.role === 'PTRT-ADMIN')).toBeTruthy();
      expect(users.some((u) => u.role === 'PTRT-USER')).toBeTruthy();
    });
  });
});
