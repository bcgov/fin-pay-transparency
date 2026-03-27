import { vi, describe, it, expect, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { appStore } from './store/modules/app';
import { authStore } from './store/modules/auth';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSnowplow = vi.fn();
globalThis.snowplow = mockSnowplow;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function navigate(
  path: string,
  meta: Record<string, unknown> = {},
): Promise<string> {
  const { default: router } = await import('./router');

  router.addRoute({
    path,
    name: path,
    component: { template: '<div />' },
    meta,
  });

  await router.push(path);
  await flushPromises();

  return router.currentRoute.value.path;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('router', () => {
  let aStore: ReturnType<typeof authStore>;
  let apStore: ReturnType<typeof appStore>;

  beforeEach(() => {
    setActivePinia(
      createTestingPinia({
        createSpy: vi.fn,
        initialState: {
          auth: {
            isAuthenticated: true,
            userInfo: null,
          },
        },
      }),
    );

    aStore = authStore();
    apStore = appStore();

    // Default: getJwtToken and getUserInfo resolve successfully.
    vi.mocked(aStore.getJwtToken).mockResolvedValue();
    vi.mocked(aStore.getUserInfo).mockResolvedValue();
  });

  // -------------------------------------------------------------------------
  // beforeEach — requiresAuth: false
  // -------------------------------------------------------------------------

  describe('when the route does not require authentication', () => {
    it('calls appStore.setPageTitle with the route page title', async () => {
      await navigate('/public', { requiresAuth: false, pageTitle: 'My Page' });
      expect(apStore.setPageTitle).toHaveBeenCalled();
    });

    it('proceeds to the requested route', async () => {
      const path = await navigate('/public', { requiresAuth: false });
      expect(path).toBe('/public');
    });

    it('does not call getJwtToken', async () => {
      await navigate('/public', { requiresAuth: false });
      expect(aStore.getJwtToken).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // beforeEach — requiresAuth: true, getJwtToken resolves
  // -------------------------------------------------------------------------

  describe('when the route requires authentication and getJwtToken resolves', () => {
    it('redirects to /token-expired when the user is not authenticated', async () => {
      aStore.isAuthenticated = false;
      const path = await navigate('/protected', { requiresAuth: true });
      expect(path).toBe('/token-expired');
    });

    it('proceeds when the user is authenticated and getUserInfo resolves', async () => {
      const path = await navigate('/protected', { requiresAuth: true });
      expect(path).toBe('/protected');
    });

    it('redirects to /error when getUserInfo rejects', async () => {
      vi.mocked(aStore.getUserInfo).mockRejectedValueOnce(new Error());
      const path = await navigate('/protected', { requiresAuth: true });
      expect(path).toBe('/error');
    });
  });

  // -------------------------------------------------------------------------
  // beforeEach — requiresAuth: true, getJwtToken rejects
  // -------------------------------------------------------------------------

  describe('when the route requires authentication and getJwtToken rejects', () => {
    it('redirects to /token-expired when userInfo exists', async () => {
      vi.mocked(aStore.getJwtToken).mockRejectedValueOnce(new Error());
      aStore.userInfo = { name: 'Alice' };
      const path = await navigate('/protected', { requiresAuth: true });
      expect(path).toBe('/token-expired');
    });

    it('redirects to /login when userInfo is null', async () => {
      vi.mocked(aStore.getJwtToken).mockRejectedValueOnce(new Error());
      const path = await navigate('/protected', { requiresAuth: true });
      expect(path).toBe('/login');
    });
  });

  // -------------------------------------------------------------------------
  // afterEach
  // -------------------------------------------------------------------------

  describe('afterEach', () => {
    it('calls snowplow trackPageView after each navigation', async () => {
      await navigate('/any', { requiresAuth: false });
      expect(mockSnowplow).toHaveBeenCalledWith('trackPageView');
    });
  });

  // -------------------------------------------------------------------------
  // scrollBehavior
  // -------------------------------------------------------------------------

  describe('scrollBehavior', () => {
    it('returns savedPosition when it exists', async () => {
      const { default: router } = await import('./router');
      const savedPosition = { left: 0, top: 200 };
      const result = router.options.scrollBehavior!({}, {}, savedPosition);
      expect(result).toBe(savedPosition);
    });

    it('returns { top: 0 } when savedPosition is null', async () => {
      const { default: router } = await import('./router');
      const result = router.options.scrollBehavior!({}, {}, null);
      expect(result).toEqual({ top: 0 });
    });
  });
});
