import { Request, Response } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { AuthBase } from './auth-utils-service';

class MockAuthSubclass extends AuthBase {
  public override renew(refreshToken: string) {}
  public override generateFrontendToken() {}
  public override getUserDescription(session: any): string {
    return 'Mock user';
  }
  public override validateClaims(jwt: any) {}
  public override handleGetUserInfo(req: Request, res: Response): any {
    return {};
  }
  public override handleGetToken(req: Request, res: Response) {}
}

const mockAuth = new MockAuthSubclass();

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

      expect(mockAuth.isTokenExpired(expiredToken)).toBeTruthy();
    });
  });
  describe('when the token has not yet expired', () => {
    it('correctly identifies that the token is still valid', () => {
      //Create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '1h',
      });

      expect(mockAuth.isTokenExpired(validToken)).toBeFalsy();
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

      expect(mockAuth.isRenewable(expiredToken)).toBeFalsy();
    });
  });
  describe('when the token has an expiration date in the future', () => {
    it('correctly identifies that the token is renewable', () => {
      //create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '1h',
      });

      expect(mockAuth.isRenewable(validToken)).toBeTruthy();
    });
  });
});
