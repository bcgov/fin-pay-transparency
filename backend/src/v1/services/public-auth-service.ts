import { pay_transparency_company } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import { config } from '../../config';
import { MISSING_COMPANY_DETAILS_ERROR } from '../../constants';
import { getCompanyDetails } from '../../external/services/bceid-service';
import { logger as log } from '../../logger';
import prisma, { PrismaTransactionalClient } from '../prisma/prisma-client';
import { authUtils } from './auth-utils-service';
import { utils } from './utils-service';
enum LogoutReason {
  Login = 'login', // ie. don't log out
  Default = 'default',
  SessionExpired = 'sessionExpired',
  LoginError = 'loginError',
  LoginBceid = 'loginBceid',
  ContactError = 'contactError',
}

const publicAuth = {
  isTokenExpired(token: string) {
    return authUtils.isTokenExpired(token);
  },

  isRenewable(token: string) {
    return authUtils.isRenewable(token);
  },

  async renew(refreshToken: string) {
    const clientId = config.get('oidc:clientId');
    const clientSecret = config.get('oidc:clientSecret');
    const scope = 'bceidbusiness';
    return authUtils.renew(refreshToken, clientId, clientSecret, scope);
  },

  async refreshJWT(req: Request, _res: Response, next: NextFunction) {
    return authUtils.refreshJWT(req, _res, next, publicAuth.renew);
  },

  generateUiToken() {
    const audience = config.get('server:frontend');
    return authUtils.generateUiToken(audience);
  },

  isValidBackendToken() {
    return authUtils.isValidBackendToken(publicAuth.validateClaims);
  },

  /**
   * check if the jwt contains valid claims.
   * The token should be issued by bceidbusiness and the audience should be the configured client id
   * Since the app is using the standard realm of Keycloak, this extra check is required to make sure other users are not able to get access.
   * https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#do-validate-the-idp-in-the-jwt
   * @param jwt the token
   */
  validateClaims: function (jwt: any) {
    const payload: JwtPayload = jsonwebtoken.decode(jwt) as JwtPayload;
    if (payload?.identity_provider !== 'bceidbusiness') {
      throw new Error(
        'backend token invalid, identity_provider is not bceidbusiness',
        jwt,
      );
    }
    if (payload?.aud !== config.get('oidc:clientId')) {
      throw new Error(
        'backend token invalid, aud claim validation failed',
        jwt,
      );
    }
    return true;
  },

  /**
   * Returns a text-based description of the user associated with the given session.
   * This is useful to log information about the user
   * @returns
   */
  getUserDescription(session: any) {
    return `[Username: ${session?.passport?.user?._json?.bceid_username}, Type: BCeID, GUID: ${session?.passport?.user?._json?.bceid_user_guid}]`;
  },

  handleGetToken(req: Request, res: Response) {
    const session: any = req.session;
    if (!session?.companyDetails) {
      log.error(
        `${MISSING_COMPANY_DETAILS_ERROR} for user ${publicAuth.getUserDescription(session)} with correlation ID ${session?.correlationID}`,
      );
      return res.status(401).json({ error: MISSING_COMPANY_DETAILS_ERROR });
    }
    authUtils.handleGetToken(req, res, publicAuth.getUserDescription);
  },

  async handleGetUserInfo(req: Request, res: Response) {
    const session: any = req.session;
    const userInfo = utils.getSessionUser(req);
    if (!userInfo?.jwt || !userInfo?._json) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'No session data',
      });
    }
    const userInfoFrontend = {
      displayName: userInfo._json.display_name,
      ...session.companyDetails,
    };
    return res.status(HttpStatus.OK).json(userInfoFrontend);
  },

  /**
   * Creates new record if this bceid is not in db.
   * Or, updates an existing recored if the details are different
   * and makes a copy of the old record in the history table
   * @param company - The logged in user's company (including bceid)
   */
  createOrUpdatePayTransparencyCompany: async function (
    company: pay_transparency_company,
    tx: PrismaTransactionalClient,
  ) {
    const { company_id, create_date, update_date, ...data } = company; // remove some properties

    const existingCompany = await tx.pay_transparency_company.findFirst({
      where: { bceid_business_guid: company.bceid_business_guid },
    });

    // If there is no existing company, create one
    if (!existingCompany) {
      await tx.pay_transparency_company.create({ data: data });
    }

    // If there is an existing company and the company details are different,
    // copy the record to the history and update the company
    else if (!this.isCompanyDetailsEqual(company, existingCompany)) {
      await tx.company_history.create({ data: existingCompany });

      await tx.pay_transparency_company.update({
        where: {
          company_id: existingCompany.company_id,
        },
        data: { ...data, create_date: new Date(), update_date: new Date() },
      });
    }
  },

  createOrUpdatePayTransparencyUser: async function (
    userInfo,
    tx: PrismaTransactionalClient,
  ) {
    const existingPayTransparencyUser =
      await tx.pay_transparency_user.findFirst({
        where: {
          bceid_user_guid: userInfo._json.bceid_user_guid,
          bceid_business_guid: userInfo._json.bceid_business_guid,
        },
      });
    if (existingPayTransparencyUser) {
      existingPayTransparencyUser.update_date = new Date();
      existingPayTransparencyUser.display_name = userInfo._json.display_name;
      await tx.pay_transparency_user.update({
        where: {
          user_id: existingPayTransparencyUser.user_id,
        },
        data: existingPayTransparencyUser,
      });
    } else {
      await tx.pay_transparency_user.create({
        data: {
          bceid_user_guid: userInfo._json.bceid_user_guid,
          bceid_business_guid: userInfo._json.bceid_business_guid,
          display_name: userInfo._json.display_name,
          create_date: new Date(),
          update_date: new Date(),
        },
      });
    }
  },
  /**
   * Convert the details returned from the BCeID SAOP service into
   * a pay_transparency_company database object
   */
  companyDetailsToRecord: function (
    details,
    bceid_guid = null,
  ): pay_transparency_company {
    return {
      bceid_business_guid: bceid_guid,
      company_id: null,
      address_line1: details.addressLine1,
      address_line2: details.addressLine2,
      city: details.city,
      company_name: details.legalName,
      country: details.country,
      postal_code: details.postal,
      province: details.province,
      create_date: null,
      update_date: null,
    };
  },
  /**
   * Check if the name and address of two company records are the same
   */
  isCompanyDetailsEqual: function (
    comp1: pay_transparency_company,
    comp2: pay_transparency_company,
  ): boolean {
    return (
      comp1.address_line1 === comp2.address_line1 &&
      comp1.address_line2 === comp2.address_line2 &&
      comp1.city === comp2.city &&
      comp1.company_name === comp2.company_name &&
      comp1.country === comp2.country &&
      comp1.postal_code === comp2.postal_code &&
      comp1.province === comp2.province
    );
  },

  async storeUserInfo(companyDetails, userInfo) {
    if (!userInfo?.jwt || !userInfo?._json) {
      throw new Error('No session data');
    }
    try {
      await prisma.$transaction(async (tx) => {
        const companyRecord: pay_transparency_company =
          this.companyDetailsToRecord(
            companyDetails,
            userInfo._json.bceid_business_guid,
          );
        await this.createOrUpdatePayTransparencyCompany(companyRecord, tx);
        await this.createOrUpdatePayTransparencyUser(userInfo, tx);
      });
    } catch (e) {
      log.error(e);
      throw new Error('Error while storing user info');
    }
  },

  async handleCallBackBusinessBceid(req: Request): Promise<LogoutReason> {
    const session: any = req.session;
    const userInfo = utils.getSessionUser(req);
    const jwtPayload = jsonwebtoken.decode(userInfo.jwt) as JwtPayload;
    const userGuid = jwtPayload?.bceid_user_guid;
    if (!userGuid) {
      log.error(`no bceid_user_guid found in the jwt token`, userInfo.jwt);
      return LogoutReason.LoginError;
    }

    try {
      publicAuth.validateClaims(userInfo.jwt);
    } catch (e) {
      log.error('invalid claims in token', e);
      return LogoutReason.LoginError;
    }

    // companyDetails already saved - success
    if (session?.companyDetails) {
      return LogoutReason.Login;
    }

    // companyDetails haven't been saved - get them
    try {
      const details = await getCompanyDetails(userGuid);

      if (
        !details.legalName ||
        !details.addressLine1 ||
        !details.city ||
        !details.province ||
        !details.country ||
        !details.postal
      ) {
        log.error(
          `Required company details missing from BCEID for user ${userGuid}`,
        );
        return LogoutReason.ContactError;
      }

      await publicAuth.storeUserInfo(details, userInfo);
      session.companyDetails = details;
    } catch (e) {
      log.error(
        `Error happened while getting company details from BCEID for user ${userGuid}`,
        e,
      );
      return LogoutReason.LoginError;
    }

    return LogoutReason.Login;
  },
};

export { LogoutReason, publicAuth };
