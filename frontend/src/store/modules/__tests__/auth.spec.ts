import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { authStore }  from '../auth';
import AuthService from '../../../common/authService';
vi.mock('../../../common/authService', async (importOriginal) => {
  const mod: any = await importOriginal();
  const resp: any = {
    default: {
      ...mod.default,
      getAuthToken: vi.fn(),
      refreshAuthToken: vi.fn()
    }
  };
  return resp;
});

describe('AuthStore', () => {
  let auth: any;
  let pinia;

  beforeEach(() => {

    pinia = createTestingPinia({ stubActions: false, fakeApp: true, createSpy: vi.fn });
    setActivePinia(pinia);

    auth = authStore(pinia);
  });
  it('setJwtToken, if provided will set value to local storage', async () => {
    await auth.setJwtToken('testToken');
    expect(localStorage.getItem('jwtToken')).toBe('testToken');
  });
  it('setJwtToken, if not provided will remove value to local storage', async () => {
    await auth.setJwtToken();
    expect(localStorage.getItem('jwtToken')).toBeNull();
  });
  it('setCorrelationID, if provided will set value to local storage', async () => {
    await auth.setCorrelationID('correlationID');
    expect(localStorage.getItem('correlationID')).toBe('correlationID');
  });
  it('setCorrelationID, if not provided will remove value to local storage', async () => {
    await auth.setCorrelationID();
    expect(localStorage.getItem('correlationID')).toBeNull();
  });
  it('getJwtToken, if token provided by API, should set in localStorage', async () => {
    (AuthService.getAuthToken as Mock).mockResolvedValueOnce({
      jwtFrontend: 'testToken',
      correlationID: 'testCorrelationID'
    } );
    await auth.getJwtToken();
    expect(localStorage.getItem('jwtToken')).toBeTruthy();
  });
});
