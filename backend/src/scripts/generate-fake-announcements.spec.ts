import { main } from './generate-fake-announcements';
const mockCreateManyAnnouncements = jest.fn();
const mockFindFirstAdminUser = jest.fn().mockResolvedValue({});
const mockDisconnect = jest.fn();
jest.mock('../v1/prisma/prisma-client', () => ({
  __esModule: true,
  default: {
    announcement: {
      createMany: (...args) => mockCreateManyAnnouncements(...args),
    },
    admin_user: {
      findFirst: (...args) => mockFindFirstAdminUser(...args),
    },
    $disconnect: (...args) => mockDisconnect(...args),
  },
}));

describe('main', () => {
  it('gets an admin_user and creates announcements', async () => {
    await main();
    expect(mockFindFirstAdminUser).toHaveBeenCalledTimes(1);
    expect(mockCreateManyAnnouncements).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
