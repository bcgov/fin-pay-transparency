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
import multer from 'multer';
import multerS3 from 'multer-s3';
import { getS3Client } from '../../external/services/s3-service';
import { config } from '../../config';

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

const upload = multer({
  storage: multerS3({
    s3: getS3Client(),
    bucket: config.get('s3:bucket'),
    metadata: function (req, file, cb) {
      cb(null, { fileName: file.originalname });
    },
    key: function (req, file, cb) {
      cb(null, req.body.attachmentId);
    },
  }),
});

router.post(
  '',
  authenticateAdmin(),
  authorize(['PTRT-ADMIN']),
  upload.single('file'),
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
  upload.single('file'),
  useValidate({ mode: 'body', schema: AnnouncementDataSchema }),
  async (req: ExtendedRequest, res) => {
    try {
      const { user } = req;
      // Request body is validated
      const data = req.body;
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
