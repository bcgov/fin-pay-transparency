import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import { config } from '../../config';
import { KEYCLOAK_IDP_HINT_AZUREIDIR, OIDC_AZUREIDIR_SCOPE } from '../../constants';
import { logger as log } from '../../logger';
import { AuthBase } from './auth-utils-service';
import { utils } from './utils-service';
import prisma, { PrismaTransactionalClient } from '../prisma/prisma-client';
import { SSO } from './admin-users-services';

enum LogoutReason {
  Login = 'login', // ie. don't log out
  Default = 'default',
  SessionExpired = 'sessionExpired',
  LoginError = 'loginError',
  LoginAzureIdir = 'loginAzureIdir',
  ContactError = 'contactError',
  NotAuthorized = 'notAuthorized',
  RoleChanged = 'roleChanged'
}

class AdminAuth extends AuthBase {
  public override async renew(refreshToken: string) {
    const clientId = config.get('oidc:adminClientId');
    const clientSecret = config.get('oidc:adminClientSecret');
    const scope = OIDC_AZUREIDIR_SCOPE;
    return super.renewImpl(refreshToken, clientId, clientSecret, scope);
  }

  public override generateFrontendToken() {
    const audience = config.get('server:adminFrontend');
    return super.generateFrontendTokenImpl(audience);
  }

  /**
   * check if the jwt contains valid claims.
   * The token should be issued by azureidir and the audience should be the configured client id
   * Since the app is using the standard realm of Keycloak, this extra check is required to make sure other users are not able to get access.
   * https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#do-validate-the-idp-in-the-jwt
   * @param jwt the token
   */
  public override validateClaims(jwt: any) {
    const payload: JwtPayload = jsonwebtoken.decode(jwt) as JwtPayload;
    if (payload?.identity_provider !== KEYCLOAK_IDP_HINT_AZUREIDIR) {
      throw new Error(
        `backend token invalid, identity_provider is not ${KEYCLOAK_IDP_HINT_AZUREIDIR}`,
        jwt
      );
    }
    if (payload?.aud !== config.get('oidc:adminClientId')) {
      throw new Error(
        'backend token invalid, aud claim validation failed',
        jwt
      );
    }
    return true;
  }

  public override getUserDescription(session: any): string {
    return `[Username: ${session?.passport?.user?._json?.idir_username}, Type: IDIR, GUID: ${session?.passport?.user?._json?.idir_user_guid}]`;
  }

  public handleGetToken = async (req: Request, res: Response): Promise<any> => {
    this.handleGetTokenImpl(req, res);
  };

  public override async handleGetUserInfo(req: Request, res: Response) {
    const userInfo = utils.getSessionUser(req);
    if (!userInfo?.jwt || !userInfo?._json) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'No session data'
      });
    }
    const userInfoFrontend = {
      displayName: userInfo._json.display_name,
      role: userInfo._json.client_roles?.[0]
    };
    return res.status(HttpStatus.OK).json(userInfoFrontend);
  }

  public async handleCallBackAzureIdir(req: Request): Promise<LogoutReason> {
    const userInfo = utils.getSessionUser(req);
    const jwtPayload = jsonwebtoken.decode(userInfo.jwt) as JwtPayload;
    const idirUserGuid = jwtPayload?.idir_user_guid;
    const email = jwtPayload?.email;
    const preferred_username = jwtPayload?.preferred_username;
    if (!idirUserGuid || !email || !preferred_username) {
      log.error(`one of mandatory parameters missing in the token, idir_user_guid: ${idirUserGuid}, email: ${email}, preferred_username: ${preferred_username}`);
      return LogoutReason.LoginError;
    }

    try {
      this.validateClaims(userInfo.jwt);
    } catch (e) {
      log.error('invalid claims in token', e);
      return LogoutReason.LoginError;
    }
    try {
      return await this.processUserOnboarding(email, preferred_username, userInfo?.refreshToken, idirUserGuid);
    } catch (e) {
      log.error('Failed while processing user onboarding.', e);
      return LogoutReason.LoginError;
    }

  }

  private async processUserOnboarding(email: string, preferred_username: string, refreshToken: string, idirUserGuid: string): Promise<LogoutReason> {
    const adminUserOnboarding = await prisma.admin_user_onboarding.findFirst({
      where: {
        email: email,
        is_onboarded: false
      }
    });
    //TODO - if onboarding request exists and has expired show the page to user to ask admin to add them again.

    // record found , need to do the processing.
    if (adminUserOnboarding) {
      // get SSO roles from Keycloak
      await this.processRolesWithKeycloak(preferred_username, adminUserOnboarding, refreshToken);
      await this.storeUserInfoWithHistory(adminUserOnboarding, idirUserGuid);
      return LogoutReason.RoleChanged;
    } else {
      log.info(`No user onboarding record found for the user ${preferred_username}, check user for roles`);
      // check for roles, if no roles found throw error
      const sso = await SSO.init();
      const userRoles = await sso.getRolesByUser(preferred_username);
      if (!userRoles || userRoles.length === 0) {
        log.error(`No roles found for the user ${preferred_username}, please contact the administrator`);
        return LogoutReason.NotAuthorized;
      }
      return LogoutReason.Login;
    }
  }

  private async storeUserInfoWithHistory(adminUserOnboarding, idirUserGuid: string) {
    await prisma.$transaction(async (tx: PrismaTransactionalClient) => {
      // update the user onboarding record, idempotent operation, also solves the edge case when call to keycloak was
      // successful earlier but db operation had failed.
      await tx.admin_user_onboarding.update({
        where: {
          admin_user_onboarding_id: adminUserOnboarding.admin_user_onboarding_id
        },
        data: {
          is_onboarded: true
        }
      });
      //// create/update a record in the admin user table
      const existing_admin_user = await tx.admin_user.findFirst({
        where: {
          idir_user_guid: idirUserGuid,
          is_active: false
        }
      });
      if (existing_admin_user) {
        await tx.admin_user.update({
          where: {
            admin_user_id: existing_admin_user.admin_user_id
          },
          data: {
            update_date: new Date(),
            update_user: adminUserOnboarding.created_by,
            assigned_roles: adminUserOnboarding.assigned_roles,
            is_active: true
          }
        });
        await tx.admin_user_history.create({
          data: {
            admin_user_id: existing_admin_user.admin_user_id,
            display_name: existing_admin_user.display_name,
            idir_user_guid: existing_admin_user.idir_user_guid,
            create_user: existing_admin_user.create_user,
            update_user: existing_admin_user.update_user,
            assigned_roles: existing_admin_user.assigned_roles,
            is_active: existing_admin_user.is_active
          }
        });

      } else {
        await tx.admin_user.create({
          data: {
            display_name: adminUserOnboarding.first_name,
            idir_user_guid: idirUserGuid,
            create_user: adminUserOnboarding.created_by,
            update_user: adminUserOnboarding.created_by,
            assigned_roles: adminUserOnboarding.assigned_roles,
            is_active: true
          }
        });
      }
    });
  }

  private async processRolesWithKeycloak(preferred_username: string, adminUserOnboarding, refreshToken: string) {
    const sso = await SSO.init();
    const userRoles = await sso.getRolesByUser(preferred_username);
    if (!userRoles || userRoles.length === 0) {
      log.info(`No roles found for the user ${preferred_username}, call API to add the roles`);
      const roles = adminUserOnboarding.assigned_roles.split(',').map(role => {
        return { name: role };
      });
      await sso.addRolesToUser(preferred_username, roles);
    }
  }
}

const adminAuth = new AdminAuth();

export { LogoutReason, adminAuth };
