import { Response, NextFunction } from 'express';
import { utils } from '../../services/utils-service';
import { ExtendedRequest } from '../../types';
import HttpStatus from 'http-status-codes';
import prisma from '../../prisma/prisma-client';

/**
 * Middleware to authenticate admin users
 * @param strict If strict is false, then it is okay to continue even if the user isn't an admin.
 * @returns
 */
export const authenticateAdmin = (strict: boolean = true) => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const userInfo = utils.getSessionUser(req);
    if (!userInfo?.jwt || !userInfo?._json) {
      if (strict)
        res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'No session data',
        });
      else next();
      return;
    }

    const preferred_username = userInfo._json.preferred_username;
    const localUser = await prisma.admin_user.findFirst({
      where: {
        preferred_username: preferred_username,
      },
    });

    if (!localUser) {
      if (strict)
        res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'User not authorized',
        });
      else next();
      return;
    }

    req.user = {
      admin_user_id: localUser.admin_user_id,
      userInfo: userInfo,
    };

    next();
  };
};
