import express, { Request, Response } from 'express';
import { logger } from '../../logger';
import { SSO } from '../services/admin-users-services';
import { utils } from '../services/utils-service';
import { PTRT_ADMIN_ROLE_NAME } from '../../constants/admin';
import { HttpStatusCode } from 'axios';

type ExtendedRequest = Request & { sso: SSO };
const router = express.Router();

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


router.post('', async (req: ExtendedRequest, res: Response) => {
  try {
    const { email, firstName, lastName } = req.body;
    if(!email || !firstName || !lastName){
      return res.status(400).json({ error: 'Missing required fields - email, firstname, lastname' });

    }

    return res.status(200).json(user);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ error: 'Failed to create user' });
  }
});
export default router;
