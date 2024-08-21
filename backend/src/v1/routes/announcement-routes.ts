import { Router } from 'express';
import { logger } from '../../logger';
import { authenticateAdmin } from '../middlewares/authorization/authenticate-admin';
import { authorize } from '../middlewares/authorization/authorize';
import { useValidate } from '../middlewares/validations';
import {
  createAnnouncement,
  getAnnouncements,
  patchAnnouncements,
  updateAnnouncement,
} from '../services/announcements-service';
import { ExtendedRequest } from '../types';
import {
  AnnouncementQuerySchema,
  AnnouncementQueryType,
  AnnouncementDataSchema,
  PatchAnnouncementsSchema,
  PatchAnnouncementsType,
} from '../types/announcements';
import formData from 'express-form-data';
import { useUpload } from '../middlewares/storage/upload';
import os from 'os';

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

router.post(
  '',
  authenticateAdmin(),
  authorize(['PTRT-ADMIN']),
  formData.parse({
    uploadDir: os.tmpdir(),
    autoClean: true,
  }),
  formData.union(),
  useUpload({ folder: 'app/announcements' }),
  useValidate({ mode: 'body', schema: AnnouncementDataSchema }),
  async (req: ExtendedRequest, res) => {
    try {
      const { user } = req;
      // Request body is validated
      const data = req.body;
      // Create announcement
      const announcement = await createAnnouncement(data, user.admin_user_id);
      res.status(201).json(announcement);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  },
);

router.put(
  '/:id',
  authenticateAdmin(),
  authorize(['PTRT-ADMIN']),
  formData.parse({
    uploadDir: os.tmpdir(),
    autoClean: true,
  }),
  formData.union(),
  useUpload({ folder: 'app/announcements' }),
  useValidate({ mode: 'body', schema: AnnouncementDataSchema }),
  async (req: ExtendedRequest, res) => {
    try {
      const { user } = req;
      // Request body is validated
      const { file, ...data } = req.body;
      // Create announcement
      const announcement = await updateAnnouncement(
        req.params.id,
        data,
        user.admin_user_id,
      );
      return res.json(announcement);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  },
);

export default router;
