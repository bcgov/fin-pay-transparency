import { LocalDateTime, ZoneId, nativeJs } from '@js-joda/core';
import { admin_user, admin_user_onboarding } from '@prisma/client';
import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import { isEqual } from 'lodash';
import { config } from '../../config';
import {
  KEYCLOAK_IDP_HINT_AZUREIDIR,
  OIDC_AZUREIDIR_SCOPE,
} from '../../constants';
import { logger as log } from '../../logger';
import prisma, { PrismaTransactionalClient } from '../prisma/prisma-client';
import { AuthBase } from './auth-utils-service';
import { SSO } from './sso-service';
import { utils } from './utils-service';

enum LogoutReason {
  Login = 'login', // ie. don't log out
  Default = 'default',
  SessionExpired = 'sessionExpired',
  LoginError = 'loginError',
  LoginAzureIdir = 'loginAzureIdir',
  ContactError = 'contactError',
  NotAuthorized = 'notAuthorized',
  RoleChanged = 'roleChanged',
  InvitationExpired = 'invitationExpired',
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
        jwt,
      );
    }
    if (payload?.aud !== config.get('oidc:adminClientId')) {
      throw new Error(
        'backend token invalid, aud claim validation failed',
        jwt,
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
        message: 'No session data',
      });
    }

    const preferred_username = userInfo._json.preferred_username;
    const localUser = await prisma.admin_user.findFirst({
      where: {
        preferred_username: preferred_username,
      },
    });

    const userInfoFrontend = {
      id: localUser?.admin_user_id,
      displayName: userInfo._json.display_name,
      roles: userInfo._json?.client_roles,
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
      log.error(
        `one of mandatory parameters missing in the token, idir_user_guid: ${idirUserGuid}, email: ${email}, preferred_username: ${preferred_username}`,
      );
      return LogoutReason.LoginError;
    }

    try {
      this.validateClaims(userInfo.jwt);
    } catch (e) {
      log.error('invalid claims in token', e);
      return LogoutReason.LoginError;
    }
    try {
      return await this.processUser(
        email,
        userInfo._json.display_name,
        preferred_username,
        userInfo?.refreshToken,
        idirUserGuid,
      );
    } catch (e) {
      log.error('Failed while processing user.', e);
      return LogoutReason.LoginError;
    }
  }

  /**
   * Process a new user, or update an existing user.
   * - Assignes roles to users who need to be onboarded.
   * - Deny access to users without sufficient permission.
   * - Update the database for this user.
   *
   * @returns LogoutReason
   * - Will throw an Error if the DB transaction is unsuccessful
   */
  private async processUser(
    email: string,
    displayName: string,
    preferred_username: string,
    refreshToken: string,
    idirUserGuid: string,
  ): Promise<LogoutReason> {
    // Onboard user if needed
    const adminUserOnboarding = await prisma.admin_user_onboarding.findFirst({
      where: {
        email: email,
        is_onboarded: false,
      },
    });

    if (adminUserOnboarding) {
      const expireDate = LocalDateTime.from(
        nativeJs(new Date(adminUserOnboarding.expiry_date)),
      );
      if (expireDate.isBefore(LocalDateTime.now(ZoneId.UTC))) {
        return LogoutReason.InvitationExpired;
      }

      // get SSO roles from Keycloak
      await this.processRolesWithKeycloak(
        preferred_username,
        adminUserOnboarding,
        refreshToken,
      );
    } else {
      log.info(
        `No user onboarding record found for the user ${preferred_username}, check user for roles`,
      );
    }

    // check for roles, if no roles then user is not authorized. SSO is the source-of-truth.
    const sso = await SSO.init();
    const userRoles = await sso.getRolesByUser(preferred_username);
    if (!userRoles || userRoles.length === 0) {
      log.error(
        `No roles found for the user ${preferred_username}, please contact the administrator`,
      );
      return LogoutReason.NotAuthorized;
    }
    const userRolesArray = userRoles.map((x) => x.name);

    // update database
    await this.storeUserInfoWithHistory(
      idirUserGuid,
      displayName,
      preferred_username,
      email,
      userRolesArray,
      adminUserOnboarding,
    );

    return adminUserOnboarding ? LogoutReason.RoleChanged : LogoutReason.Login;
  }

  /**
   * This function accomplishes several goals:
   * - A user who is being onboarded will have their record in the admin_user_onboarding
   *   updated to be complete and in the same transaction will have their user details
   *   added to admin_user. This way in case there is an error, the user can be onboarded
   *   properly the next time they try to log in.
   * - This function assumes that the user has permission from keycloak. If the user is
   *   not in the admin_user table, then add the user. This can happen if a user was not
   *   onboarded through the Admin Portal, but was directly added in keycloak.
   * - If any of the details of the user are being changed, for example, they're permissions
   *   are being revoked or reinstated, the we keep a record of that in the history table.
   * - Every time a user logs in, the last_login date is updated.
   *
   * @param adminUserOnboarding - (optional) Onboarding object from database if onboarding a user
   * @param existing_admin_user - (optional) The existing user can be passed in to reduce the number of db calls
   * @param isLogin - (optional) Whether or not to set the last_login date or not. Default is 'true'.
   * @returns - 'true' if the admin_user table was updated, otherwise 'false'
   * - Will throw an Error if the DB transaction is unsuccessful
   */

  public async storeUserInfoWithHistory(
    idirUserGuid: string,
    displayName: string,
    preferred_username: string,
    email: string,
    userRoles: string[],
    adminUserOnboarding?: admin_user_onboarding,
    existing_admin_user?: admin_user,
    isLogin: boolean = true,
  ): Promise<boolean> {
    const assigned_roles = userRoles.join(',');
    let modified = false;
    await prisma.$transaction(async (tx: PrismaTransactionalClient) => {
      // update the user onboarding record, idempotent operation, also solves the edge
      // case when call to keycloak was successful earlier but db operation had failed.
      if (adminUserOnboarding) {
        await tx.admin_user_onboarding.update({
          where: {
            admin_user_onboarding_id:
              adminUserOnboarding.admin_user_onboarding_id,
          },
          data: {
            is_onboarded: true,
          },
        });
      }

      if (!existing_admin_user)
        existing_admin_user = await prisma.admin_user.findFirst({
          where: {
            idir_user_guid: idirUserGuid,
          },
        });

      // check if the new-roles and old-roles are equal by sorting the
      // arrays and comparing (note: slice() and localeCompare() are to appease sonar)
      const areAssignedRolesEqual = isEqual(
        existing_admin_user?.assigned_roles
          .split(',')
          .slice()
          .sort((a, b) => a.localeCompare(b)),
        userRoles.slice().sort((a, b) => a.localeCompare(b)),
      );

      // create/update a record in the admin user table
      if (
        existing_admin_user &&
        (!areAssignedRolesEqual ||
          existing_admin_user.display_name != displayName ||
          existing_admin_user.preferred_username != preferred_username ||
          !existing_admin_user.is_active)
      ) {
        // The details of the user has changed, we need to store
        // the existing user in the history table.
        await tx.admin_user.update({
          where: {
            admin_user_id: existing_admin_user.admin_user_id,
          },
          data: {
            display_name: displayName,
            preferred_username: preferred_username,
            email: email,
            update_date: new Date(),
            update_user: adminUserOnboarding?.created_by ?? 'Keycloak',
            assigned_roles: assigned_roles,
            is_active: true,
            last_login: isLogin ? new Date() : undefined,
          },
        });
        await tx.admin_user_history.create({
          data: {
            admin_user_id: existing_admin_user.admin_user_id,
            display_name: existing_admin_user.display_name,
            idir_user_guid: existing_admin_user.idir_user_guid,
            create_user: existing_admin_user.create_user,
            update_user: existing_admin_user.update_user,
            assigned_roles: existing_admin_user.assigned_roles,
            is_active: existing_admin_user.is_active,
            preferred_username: existing_admin_user.preferred_username,
            email: existing_admin_user.email,
            create_date: existing_admin_user.create_date,
            update_date: existing_admin_user.update_date,
          },
        });
        modified = true;
      } else if (existing_admin_user && isLogin) {
        // There is an existing user, but none of their details have
        // changed, so just update the last login time.
        await tx.admin_user.update({
          where: {
            admin_user_id: existing_admin_user.admin_user_id,
          },
          data: {
            last_login: new Date(),
          },
        });
        modified = true;
      } else if (!existing_admin_user) {
        // There is not an existing user, so make one.
        await tx.admin_user.create({
          data: {
            display_name: displayName,
            idir_user_guid: idirUserGuid,
            create_user: adminUserOnboarding?.created_by ?? 'Keycloak',
            update_user: adminUserOnboarding?.created_by ?? 'Keycloak',
            assigned_roles: assigned_roles,
            is_active: true,
            preferred_username,
            last_login: isLogin ? undefined : new Date(0),
          },
        });
        modified = true;
      }
    });

    return modified;
  }

  private async processRolesWithKeycloak(
    preferred_username: string,
    adminUserOnboarding: admin_user_onboarding,
    refreshToken: string,
  ) {
    const sso = await SSO.init();
    const userRoles = await sso.getRolesByUser(preferred_username);
    if (!userRoles || userRoles.length === 0) {
      log.info(
        `No roles found for the user ${preferred_username}, call API to add the roles`,
      );
      const roles = adminUserOnboarding.assigned_roles
        .split(',')
        .map((role) => {
          return { name: role };
        });
      await sso.addRolesToUser(preferred_username, roles);
    }
  }
}

const adminAuth = new AdminAuth();

export { LogoutReason, adminAuth };
