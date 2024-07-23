import { Router } from 'express';
import { useValidate } from '../middlewares/validations';
import {
  AnnouncementQuerySchema,
  AnnouncementQueryType,
  PatchAnnouncementsSchema,
  PatchAnnouncementsType,
} from '../types/announcements';
import { logger } from '../../logger';
import {
  getAnnouncements,
  patchAnnouncements,
} from '../services/announcements-service';
import { authenticateAdmin } from '../middlewares/authorization/authenticate-admin';
import { authorize } from '../middlewares/authorization/authorize';
import { ExtendedRequest } from '../types';

const router = Router();

router.get(
  '',
  useValidate({ mode: 'query', schema: AnnouncementQuerySchema }),
  async (req, res) => {
    try {
      // Query parameters are validated
      const query: AnnouncementQueryType = req.query;
      const announcements = await getAnnouncements(query);
      res.status(200).json(announcements);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  },
);

/**
 * Patch announcements, only PTRT-ADMIN can patch announcements
 * @route PATCH /announcements
 * @summary Currently only used to delete announcements
 */
router.patch(
  '',
  useValidate({ mode: 'body', schema: PatchAnnouncementsSchema }),
  authenticateAdmin(),
  authorize(['PTRT-ADMIN']),
  async (req: ExtendedRequest, res) => {
    try {
      const { user } = req;
      const data: PatchAnnouncementsType = req.body;
      await patchAnnouncements(data, user.admin_user_id);
      res.status(201).json({ message: 'Announcement deleted' });
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  },
);

export default router;
