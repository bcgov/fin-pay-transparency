import express, { NextFunction, Request, Response } from 'express';
import { logger } from '../../logger';
import { AdminUserService } from '../services/admin-users-services';
import { utils } from '../services/utils-service';
import {
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin';
import { HttpStatusCode } from 'axios';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import { useValidate } from '../validations';
import { AddNewUserSchema, AddNewUserType } from '../validations/schemas';
import { SSO } from '../services/sso-service';
import z, { ZodSchema } from 'zod';

export const validateRequest = (mode: 'body' | 'query', schema: ZodSchema) => {
  return async (req: ExtendedRequest, _: Response, next: NextFunction) => {
    const data = req[mode];

    try {
      await schema.parseAsync(data);
      next();
    } catch (error) {
      next(error);
    }
  };
};

type ExtendedRequest = Request & { sso: SSO };
const router = express.Router();

/**
 * Middleware to check if user has a PTRT-ADMIN role
 */
router.use(async (req: ExtendedRequest, res: Response, next) => {
  const user = utils.getSessionUser(req);
  const roles = user._json.client_roles as string[];
  if (!roles.includes(PTRT_ADMIN_ROLE_NAME)) {
    return res
      .status(HttpStatusCode.Unauthorized)
      .json({ error: 'Not authorized' });
  }

  next();
});

/**
 * Attach the CSS SSO client
 */
router.use(async (req: ExtendedRequest, _, next) => {
  try {
    const sso = await SSO.init();
    req.sso = sso;
    next();
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

/**
 * Get all users in the system
 */
router.get('', async (req: ExtendedRequest, res: Response) => {
  try {
    const users = await req.sso.getUsers();
    return res.status(200).json(users);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ error: 'Failed to get users' });
  }
});

router.post(
  '',
  useValidate({ mode: 'body', schema: AddNewUserSchema }),
  async (req: ExtendedRequest, res: Response) => {
    try {
      const { email, firstName, role } = req.body as AddNewUserType;
      const userInfo = utils.getSessionUser(req);
      const jwtPayload = jsonwebtoken.decode(userInfo.jwt) as JwtPayload;
      const idirUserGuid = jwtPayload?.idir_user_guid;
      await new AdminUserService().addNewUser(
        email.trim().toLowerCase(),
        role,
        firstName,
        idirUserGuid,
      );
      return res.status(200).json();
    } catch (error) {
      logger.error(error);
      return res.status(400).json({ error: 'Failed to create user' });
    }
  },
);
const ASSIGN_ROLE_SCHEMA = z.object({
  role: z.enum([PTRT_ADMIN_ROLE_NAME, PTRT_USER_ROLE_NAME]),
});

/**
 * Assign user role
 */
router.patch(
  '/:userId',
  validateRequest('body', ASSIGN_ROLE_SCHEMA),
  async (req: ExtendedRequest, res: Response) => {
    const { userId } = req.params;
    const data: z.infer<typeof ASSIGN_ROLE_SCHEMA> = req.body;

    try {
      await req.sso.assignRoleToUser(userId, data.role);

      return res
        .status(204)
        .json({ message: 'Successfully assigned user role' });
    } catch (error) {
      logger.error(error);
      return res.status(400).json({ error: 'Failed to assign user role' });
    }
  },
);

/**
 * Delete user
 */
router.delete('/:userId', async (req: ExtendedRequest, res: Response) => {
  const { userId } = req.params;

  try {
    await req.sso.deleteUser(userId);
    return res.status(204).json();
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ error: 'Failed to delete user' });
  }
});

export default router;
