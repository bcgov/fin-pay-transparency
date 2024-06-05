import jsonwebtoken from 'jsonwebtoken';
import { authUtils } from './auth-utils-service';

afterEach(() => {
  jest.clearAllMocks();
});

describe('isTokenExpired', () => {
  describe('when the token is expired', () => {
    it('correctly identifies the expired token', () => {
      //Create a token that expired 1 hour ago
      const expiredToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '-1h',
      });

      expect(authUtils.isTokenExpired(expiredToken)).toBeTruthy();
    });
  });
  describe('when the token has not yet expired', () => {
    it('correctly identifies that the token is still valid', () => {
      //Create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '1h',
      });

      expect(authUtils.isTokenExpired(validToken)).toBeFalsy();
    });
  });
});

describe('isRenewable', () => {
  describe('when the token is expired', () => {
    it("correctly identifies that the token isn't renewable", () => {
      //Create a token that expired 1 hour ago
      const expiredToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '-1h',
      });

      expect(authUtils.isRenewable(expiredToken)).toBeFalsy();
    });
  });
  describe('when the token has an expiration date in the future', () => {
    it('correctly identifies that the token is renewable', () => {
      //create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '1h',
      });

      expect(authUtils.isRenewable(validToken)).toBeTruthy();
    });
  });
});
