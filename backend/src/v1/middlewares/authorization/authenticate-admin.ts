import { Response, NextFunction } from 'express';
import { utils } from '../../services/utils-service';
import { ExtendedRequest } from '../../types';
import HttpStatus from 'http-status-codes';
import prisma from '../../prisma/prisma-client';

/**
 * Middleware to authenticate admin users
 * @returns
 */
export const authenticateAdmin = () => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
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

    if (!localUser) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'User not authorized',
      });
    }

    req.user = {
      admin_user_id: localUser.admin_user_id,
      userInfo: userInfo,
    };

    next();
  };
};
