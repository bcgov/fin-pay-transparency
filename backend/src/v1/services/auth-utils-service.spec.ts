import { Request, Response } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { AuthBase } from './auth-utils-service.js';

const mockRenewSuccessResult = {
  jwt: 'mock jwt',
  refreshToken: 'mock refresh token',
  idToken: 'mock id token',
};

class MockAuthSubclass extends AuthBase {
  public override async renew(refreshToken: string): Promise<any> {}
  public override generateFrontendToken(): string {
    return '';
  }
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

describe('renewBackendAndFrontendTokens', () => {
  describe('when the refresh token is successfully exchanged for new backend tokens', () => {
    it('sets a success code in the response', async () => {
      const mockFrontendToken = 'sdf345dsf';
      jest.spyOn(mockAuth, 'renew').mockResolvedValue(mockRenewSuccessResult);
      const generateFrontendTokenSpy = jest
        .spyOn(mockAuth, 'generateFrontendToken')
        .mockReturnValue(mockFrontendToken);
      const req = {
        user: { refreshToken: 'mock refresh token' } as unknown,
        session: {},
      } as Request;
      const res: any = new Object();
      res.status = jest.fn().mockReturnValue(res) as unknown;
      res.json = jest.fn() as unknown;

      await mockAuth.renewBackendAndFrontendTokens(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].jwtFrontend).toBe(
        generateFrontendTokenSpy.mock.results[0].value,
      );
    });
  });
  describe('when the refresh token is not successfully exchanged for new backend tokens', () => {
    it('sets an unauthorized code in the response', async () => {
      jest.spyOn(mockAuth, 'renew').mockResolvedValue(null);
      const req = {
        user: { refreshToken: 'mock refresh token' } as unknown,
        session: {},
      } as Request;
      const res = {
        status: jest.fn().mockReturnValue({
          json: jest.fn(),
        }) as unknown,
      } as Response;
      await mockAuth.renewBackendAndFrontendTokens(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
