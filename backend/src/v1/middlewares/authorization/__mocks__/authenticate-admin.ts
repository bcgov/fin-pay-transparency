// __mocks__/authenticate-admin.ts
//
// Manual mock for authenticateAdmin middleware.
// Automatically used when vi.mock('.../authenticate-admin') is called.
//
// Three states mirror real middleware behaviour:
//   'admin'        - req.user is populated, next() called
//   'non-admin'    - next() if strict==false, 401 if strict==true
//   'unauthorized' - next() if strict==false, 401 if strict==true
//
// Usage:
//   beforeEach(() => setAdminAuthState());
//   it('...', () => setAdminAuthState('non-admin'));
//   it('...', () => setAdminAuthState('admin', { admin_user_id: '1234', userInfo: {} }));

import { faker } from '@faker-js/faker';

type AdminAuthState = 'admin' | 'non-admin' | 'unauthorized';

let adminAuthState: AdminAuthState = 'admin';
let adminUser = { admin_user_id: faker.string.uuid(), userInfo: {} };

export const authenticateAdmin =
  (strict: boolean = true) =>
  (req, res, next) => {
    if (adminAuthState === 'admin') {
      req.user = adminUser;
      next();
    } else if (adminAuthState === 'non-admin') {
      if (strict) res.status(401).json({ message: 'User not authorized' });
      else next();
    } else {
      if (strict) res.status(401).json({ message: 'No session data' });
      else next();
    }
  };

/** Set auth state for subsequent requests. Call with no args to reset to defaults. */
export const setAdminAuthState = (
  state: AdminAuthState = 'admin',
  user?: { admin_user_id: string; userInfo: any },
) => {
  adminAuthState = state;
  adminUser = user ?? { admin_user_id: faker.string.uuid(), userInfo: {} };
};
