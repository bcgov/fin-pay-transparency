import { Request, Response, Router } from 'express';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import { PTRT_ADMIN_ROLE_NAME } from '../../constants/admin';
import { logger } from '../../logger';
import { authorize } from '../middlewares/authorization/authorize';
import { useValidate } from '../middlewares/validations';
import {
  AddNewUserSchema,
  AddNewUserType,
} from '../middlewares/validations/schemas';
import {
  createInvite,
  deleteInvite,
  getPendingInvites,
  resendInvite,
} from '../services/admin-user-invites-service';
import { utils } from '../services/utils-service';
import { UserInputError } from '../types/errors';

const router = Router();
router.use(authorize([PTRT_ADMIN_ROLE_NAME]));

router.get('', async (req: Request, res: Response) => {
  try {
    const invites = await getPendingInvites();
    return res.status(200).json(invites);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ error: 'Failed to get invites' });
  }
});

router.post(
  '',
  useValidate({ mode: 'body', schema: AddNewUserSchema }),
  async (req, res: Response) => {
    try {
      const { email, firstName, role } = req.body as AddNewUserType;
      const userInfo = utils.getSessionUser(req);
      const jwtPayload = jsonwebtoken.decode(userInfo.jwt) as JwtPayload;
      const idirUserGuid = jwtPayload?.idir_user_guid;
      await createInvite(
        email.trim().toLowerCase(),
        role,
        firstName,
        idirUserGuid,
      );
      return res.status(200).json({ message: 'User invite created' });
    } catch (error) {
      logger.error(error);
      if (error instanceof UserInputError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(400).json({ error: 'Failed to create user' });
    }
  },
);

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await resendInvite(id);
    return res.status(200).json({ message: 'Invite resent' });
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ error: 'Failed to resend invite' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteInvite(id);
    return res.status(200).json({ message: 'Invite deleted' });
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ error: 'Failed to delete invite' });
  }
});

export default router;
