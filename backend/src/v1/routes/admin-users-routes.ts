import express, { Request, Response } from 'express';
import { logger } from '../../logger';
import { SSO, AdminUserService } from '../services/admin-users-services';
import { utils } from '../services/utils-service';
import { PTRT_ADMIN_ROLE_NAME } from '../../constants/admin';
import { HttpStatusCode } from 'axios';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';

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
    const { email, firstName, roles } = req.body;
    if(!email || !firstName || !roles){
      return res.status(400).json({ error: 'Missing required fields - email, firstname, roles' });
    }
    const userInfo = utils.getSessionUser(req);
    const jwtPayload = jsonwebtoken.decode(userInfo.jwt) as JwtPayload;
    const idirUserGuid = jwtPayload?.idir_user_guid;
    await new AdminUserService().addNewUser(email, roles, firstName, idirUserGuid);
    return res.status(200).json();
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});
export default router;
