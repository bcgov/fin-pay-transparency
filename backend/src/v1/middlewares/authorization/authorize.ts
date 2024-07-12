import { utils } from '../../services/utils-service';
import { RoleType } from '../../types/users';
import intersection from 'lodash/intersection';
import { Request, Response } from 'express';
import { HttpStatusCode } from 'axios';

export const authorize = (checkRoles: RoleType[]) => {
  return async (req: Request, res: Response, next) => {
    const user = utils.getSessionUser(req);
    const roles = user._json.client_roles as string[];
    if (!intersection(roles, checkRoles).length) {
      return res
        .status(HttpStatusCode.Unauthorized)
        .json({ error: 'Not authorized' });
    }

    next();
  };
};
