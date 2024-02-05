import * as PuppeteerService from './puppeteer-service';

const mock_launch = jest.fn();
jest.mock('puppeteer', () => ({
  ...jest.requireActual('puppeteer'),
  launch: (...args) => mock_launch(...args),
}));

describe('puppeteer-service', () => {
  describe('initBrowser', () => {
    it('should launch browser', async () => {
      await PuppeteerService.initBrowser();
      expect(mock_launch).toHaveBeenCalled();
    });
  });

  describe('getBrowser', () => {
    it('should use existing browser', async () => {
      mock_launch.mockImplementation(() => {
        return {};
      });

      const browser = await PuppeteerService.getBrowser();

      expect(mock_launch).toHaveBeenCalled();

      expect(browser).toBeDefined();
    });

    it('should launch new browser if none already exist', async () => {
      const browser = await PuppeteerService.getBrowser();

      expect(mock_launch).toHaveBeenCalled();

      expect(browser).toBeDefined();
    });

    it('should launch new browser if not connected', async () => {
      mock_launch.mockImplementation(() => {
        return { connected: false };
      });

      const browser = await PuppeteerService.getBrowser();

      expect(mock_launch).toHaveBeenCalled();

      expect(browser).toBeDefined();
    });
  });
});
