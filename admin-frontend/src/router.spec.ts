import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { appStore } from './store/modules/app';
import { authStore } from './store/modules/auth';
import { ADMIN_ROLE_NAME } from './constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function navigate(
  path: string,
  meta: Record<string, unknown> = {},
): Promise<string> {
  const { default: router } = await import('./router.js');

  router.addRoute({
    path,
    name: path,
    component: { template: '<div />' },
    meta,
  });

  await router.push(path);
  await router.isReady();

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

    vi.mocked(aStore.getJwtToken).mockResolvedValue();
    vi.mocked(aStore.getUserInfo).mockResolvedValue();
    vi.mocked(aStore.doesUserHaveRole).mockReturnValue(true);
  });

  // -------------------------------------------------------------------------
  // scrollBehavior
  // -------------------------------------------------------------------------

  describe('scrollBehavior', () => {
    it('returns savedPosition when it exists', async () => {
      const { default: router } = await import('./router.js');
      const savedPosition = { left: 0, top: 200 };
      const result = router.options.scrollBehavior!({}, {}, savedPosition);
      expect(result).toBe(savedPosition);
    });

    it('returns { top: 0 } when savedPosition is null', async () => {
      const { default: router } = await import('./router.js');
      const result = router.options.scrollBehavior!({}, {}, null);
      expect(result).toEqual({ top: 0 });
    });
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
  // beforeEach — requiresRole
  // -------------------------------------------------------------------------

  describe('when the route requires a role', () => {
    it('proceeds when the user has the required role', async () => {
      vi.mocked(aStore.doesUserHaveRole).mockReturnValueOnce(true);
      const path = await navigate('/admin', {
        requiresAuth: true,
        requiresRole: ADMIN_ROLE_NAME,
      });
      expect(path).toBe('/admin');
    });

    it('redirects to /notfound when the user does not have the required role', async () => {
      vi.mocked(aStore.doesUserHaveRole).mockReturnValueOnce(false);
      const path = await navigate('/admin', {
        requiresAuth: true,
        requiresRole: ADMIN_ROLE_NAME,
      });
      expect(path).toBe('/notfound');
    });

    it('does not check role when requiresRole is not set', async () => {
      await navigate('/protected', { requiresAuth: true });
      expect(aStore.doesUserHaveRole).not.toHaveBeenCalled();
    });
  });
});
