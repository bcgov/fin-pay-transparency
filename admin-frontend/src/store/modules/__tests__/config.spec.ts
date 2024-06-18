import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IConfigValue } from '../../../types';
import { useConfigStore } from '../config';

const mockGetConfig = vi.fn();

vi.mock('../../../services/apiService', () => ({
  default: {
    getConfig: () => mockGetConfig(),
  },
}));

describe('useConfigStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  afterEach(() => {
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
