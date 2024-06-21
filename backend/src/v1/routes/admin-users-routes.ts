import express, { Request, Response } from 'express';
import { logger } from '../../logger';
import { SSO } from '../services/admin-users-services';

const router = express.Router();

type ExtendedRequest = Request & { sso: SSO };
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

router.get('', async (req: ExtendedRequest, res: Response) => {
  try {
    const users = await req.sso.getUsers();
    return res.status(200).json(users);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ error: 'Failed to get users' });
  }
});

export default router;
