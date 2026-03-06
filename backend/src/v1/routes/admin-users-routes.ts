import express, { Request, Response } from 'express';
import { logger } from '../../logger.js';
import { PTRT_ADMIN_ROLE_NAME } from '../../constants/admin.js';
import { useValidate } from '../middlewares/validations/validate.js';
import {
  ASSIGN_ROLE_SCHEMA,
  AssignRoleType,
} from '../middlewares/validations/schemas.js';
import { SSO } from '../services/sso-service.js';
import { authorize } from '../middlewares/authorization/authorize.js';
import { ExtendedRequest } from '../types/request.js';
import { authenticateAdmin } from '../middlewares/authorization/authenticate-admin.js';
import z from 'zod';

// Reusable Zod schema for string id
const IdParamSchema = z.object({
  userId: z.string(),
});

type SsoRequest = Request & { sso: SSO };
type SsoExtendedRequest = ExtendedRequest & { sso: SSO };
const router = express.Router();
router.use(authorize([PTRT_ADMIN_ROLE_NAME]));

/**
 * Attach the CSS SSO client
 */
router.use(async (req: SsoRequest, _, next) => {
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
router.get('', async (req: SsoRequest, res: Response) => {
  try {
    const users = await req.sso.getUsersForDisplay();
    res.status(200).json(users);
  } catch (error) {
    logger.error(error);
    res.status(400).json({ error: 'Failed to get users' });
  }
});

/**
 * Assign user role
 */
router.patch(
  '/:userId',
  useValidate({ mode: 'body', schema: ASSIGN_ROLE_SCHEMA }),
  async (req: SsoRequest, res: Response) => {
    const { userId } = IdParamSchema.parse(req.params);
    const data: AssignRoleType = req.body;

    try {
      await req.sso.assignRoleToUser(userId, data.role);

      res.status(204).json({ message: 'Successfully assigned user role' });
    } catch (error) {
      logger.error(error);
      res.status(400).json({ error: 'Failed to assign user role' });
    }
  },
);

/**
 * Delete user
 */
router.delete(
  '/:userId',
  authenticateAdmin(),
  authorize(['PTRT-ADMIN']),
  async (req: SsoExtendedRequest, res: Response) => {
    try {
      const { userId } = IdParamSchema.parse(req.params);
      await req.sso.deleteUser(userId, req.user.admin_user_id);
      res.json();
    } catch (error) {
      logger.error(error);
      res.status(400).json({ error: 'Failed to delete user' });
    }
  },
);

export default router;
