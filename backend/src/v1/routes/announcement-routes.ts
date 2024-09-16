import { Request, Router } from 'express';
import formData from 'express-form-data';
import os from 'os';
import { APP_ANNOUNCEMENTS_FOLDER } from '../../constants/admin';
import { logger } from '../../logger';
import { authenticateAdmin } from '../middlewares/authorization/authenticate-admin';
import { authorize } from '../middlewares/authorization/authorize';
import { useUpload } from '../middlewares/storage/upload';
import { useValidate } from '../middlewares/validations';
import {
  createAnnouncement,
  getAnnouncementById,
  getAnnouncements,
  patchAnnouncements,
  updateAnnouncement,
} from '../services/announcements-service';
import { ExtendedRequest } from '../types';
import {
  AnnouncementDataSchema,
  AnnouncementQuerySchema,
  AnnouncementQueryType,
  AnnouncementStatus,
  PatchAnnouncementsSchema,
  PatchAnnouncementsType,
} from '../types/announcements';
import { omit } from 'lodash';
import { DateTimeFormatter, ZonedDateTime } from '@js-joda/core';

const router = Router();

type SsoRequest = ExtendedRequest & { query: AnnouncementQueryType };

router.get(
  '',
  authenticateAdmin(false),
  async (req: SsoRequest, res, next) => {
    if (!req?.user?.admin_user_id) {
      // If this is not an admin user, then it is a public user and they are strictly limited to what they can do
      const now = ZonedDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
      req.query.filters = [
        {
          key: 'status',
          operation: 'in',
          value: ['PUBLISHED'],
        },
        {
          key: 'active_on',
          operation: 'lte',
          value: now,
        },
        {
          key: 'expires_on',
          operation: 'gt',
          value: now,
        },
      ];
      req.query.sort = [{ field: 'updated_date', order: 'desc' }];
    }
    next();
  },
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
 * @summary Currently the only announcement attribute that can be changed
 * by this endoint is the status.  It can be set to either DELETED or DRAFT.
 */
router.patch(
  '',
  useValidate({ mode: 'body', schema: PatchAnnouncementsSchema }),
  authenticateAdmin(),
  authorize(['PTRT-ADMIN']),
  async (req: ExtendedRequest, res) => {
    const supportedStatuses = [
      AnnouncementStatus.Deleted,
      AnnouncementStatus.Draft,
    ];
    try {
      const { user } = req;
      const data: PatchAnnouncementsType = req.body;
      const invalidRecs = data.filter(
        (d) => supportedStatuses.indexOf(d.status as any) < 0,
      );
      if (invalidRecs.length) {
        throw new Error(
          `Only the following statuses are supported: ${supportedStatuses}`,
        );
      }
      await patchAnnouncements(data, user.admin_user_id);
      res
        .status(201)
        .json({ message: `Updated the status of the announcement(s)` });
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
  useUpload({ folder: APP_ANNOUNCEMENTS_FOLDER }),
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
  useUpload({ folder: APP_ANNOUNCEMENTS_FOLDER }),
  useValidate({ mode: 'body', schema: AnnouncementDataSchema }),
  async (req: ExtendedRequest, res) => {
    try {
      const { user } = req;
      // Request body is validated
      const { file, ...data } = req.body;
      // Create announcement
      const announcement = await updateAnnouncement(
        req.params.id,
        /* istanbul ignore next */
        file ? data : omit(data, 'attachmentId'),
        user.admin_user_id,
      );
      return res.json(announcement);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  },
);

router.get('/:id', authenticateAdmin(), async (req: Request, res) => {
  try {
    const announcement = await getAnnouncementById(req.params.id);
    return res.json(announcement);
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: 'Invalid request', error });
  }
});

export default router;
