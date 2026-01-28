import { Request, Response, Router } from 'express';
import { z } from 'zod';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import { PTRT_ADMIN_ROLE_NAME } from '../../constants/admin';
import { logger } from '../../logger';
import { authorize } from '../middlewares/authorization/authorize';
import { useValidate } from '../middlewares/validations/validate';
import {
  AddNewUserSchema,
  AddNewUserType,
} from '../middlewares/validations/schemas';
import { adminUserInvitesService } from '../services/admin-user-invites-service';
import { utils } from '../services/utils-service';
import { UserInputError } from '../types/errors';

// Reusable Zod schema for string id
const IdParamSchema = z.object({
  id: z.string(),
});

const router = Router();
router.use(authorize([PTRT_ADMIN_ROLE_NAME]));

router.get('', async (req: Request, res: Response) => {
  try {
    const invites = await adminUserInvitesService.getPendingInvites();
    res.status(200).json(invites);
  } catch (error) {
    logger.error(error);
    res.status(400).json({ error: 'Failed to get invites' });
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
      await adminUserInvitesService.createInvite(
        email.trim().toLowerCase(),
        role,
        firstName,
        idirUserGuid,
      );
      res.status(200).json({ message: 'User invite created' });
    } catch (error) {
      logger.error(error);
      if (error instanceof UserInputError)
        res.status(400).json({ message: error.message });
      else res.status(500).json({ error: 'Failed to create user' });
    }
  },
);

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = IdParamSchema.parse(req.params);
    await adminUserInvitesService.resendInvite(id);
    res.status(200).json({ message: 'Invite resent' });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ error: 'Failed to resend invite' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = IdParamSchema.parse(req.params);
    await adminUserInvitesService.deleteInvite(id);
    res.status(200).json({ message: 'Invite deleted' });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ error: 'Failed to delete invite' });
  }
});

export default router;
