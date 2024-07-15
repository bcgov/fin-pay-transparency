import express, { Request, Response } from 'express';
import { logger } from '../../logger';
import { PTRT_ADMIN_ROLE_NAME } from '../../constants/admin';
import { useValidate } from '../middlewares/validations';
import {
  ASSIGN_ROLE_SCHEMA,
  AssignRoleType,
} from '../middlewares/validations/schemas';
import { SSO } from '../services/sso-service';
import { authorize } from '../middlewares/authorization/authorize';

type ExtendedRequest = Request & { sso: SSO };
const router = express.Router();
router.use(authorize([PTRT_ADMIN_ROLE_NAME]));

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

/**
 * Assign user role
 */
router.patch(
  '/:userId',
  useValidate({ mode: 'body', schema: ASSIGN_ROLE_SCHEMA }),
  async (req: ExtendedRequest, res: Response) => {
    const { userId } = req.params;
    const data: AssignRoleType = req.body;

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
    return res.json();
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ error: 'Failed to delete user' });
  }
});

export default router;
