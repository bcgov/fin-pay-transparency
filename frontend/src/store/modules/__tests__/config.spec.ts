import { beforeEach, describe, it, expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useConfigStore } from '../config';
import { IConfigValue } from '../../../common/types';

const mockGetConfig = vi.fn();

vi.mock('../../../common/apiService', () => ({
  default: {
    getConfig: () => mockGetConfig(),
  },
}));

describe('useConfigStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });
  describe('defaults', () => {
    it('should default to undefined config value', () => {
      const store = useConfigStore();
      expect(store.config).toBe<IConfigValue | undefined>(undefined);
    });
  });

  describe('methods', () => {
    describe('loadConfig', () => {
      it('should load config from api', async () => {
        mockGetConfig.mockReturnValue({ maxUploadFileSize: 8000000 });
        const store = useConfigStore();
        expect(store.config).toBe<IConfigValue | undefined>(undefined);
        await store.loadConfig();
        expect(store.config).toEqual({ maxUploadFileSize: 8000000 });
      });
      it('should not reload config', async () => {
        const store = useConfigStore();
        store.$patch({ config: { maxUploadFileSize: 8000000 } });
        await store.loadConfig();
        expect(mockGetConfig).not.toHaveBeenCalled();
      });
    });
  });
});
