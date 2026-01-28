import { Request, Router } from 'express';
import formData from 'express-form-data';
import os from 'node:os';
import { APP_ANNOUNCEMENTS_FOLDER } from '../../constants/admin';
import { logger } from '../../logger';
import { authenticateAdmin } from '../middlewares/authorization/authenticate-admin';
import { authorize } from '../middlewares/authorization/authorize';
import { useUpload } from '../middlewares/storage/upload';
import { useValidate } from '../middlewares/validations/validate';
import { announcementService } from '../services/announcements-service';
import { ExtendedRequest } from '../types/request';
import {
  AnnouncementDataSchema,
  AnnouncementQuerySchema,
  AnnouncementQueryType,
  AnnouncementStatus,
  PatchAnnouncementsSchema,
  PatchAnnouncementsType,
} from '../types/announcements';
import { DateTimeFormatter, ZonedDateTime } from '@js-joda/core';

const router = Router();

type SsoRequest = ExtendedRequest & { query: AnnouncementQueryType };

router.get(
  '',
  authenticateAdmin(false),
  async (req: SsoRequest, res, next) => {
    if (!req?.user?.admin_user_id) {
      // If this is not an admin user, then it is a public user and they are strictly limited to what they can do

      // Express v5 doesn't allow you to change these properties, however, this app was originally made
      // using v4. To support v5 without a lot of rewrite, defineProperty() is used to forcibly
      // change this property. Because this was originally a v4 project, this should work fine since
      // this project is expecting a mutable property, but is not recommended for new v5 projects.

      // remove all existing query params
      Object.defineProperty(req, 'query', {
        value: {},
        enumerable: true,
        configurable: true,
        writable: true,
      });
      // remove all url params (shouldn't be any anyways)
      Object.defineProperty(req, 'params', {
        value: {},
        enumerable: true,
        configurable: true,
        writable: true,
      });
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
      req.query.offset = 0;
      req.query.limit = 100;
    }
    next();
  },
  useValidate({ mode: 'query', schema: AnnouncementQuerySchema }),
  async (req, res) => {
    try {
      // Query parameters are validated
      const query: AnnouncementQueryType = req.query;
      const announcements = await announcementService.getAnnouncements(query);
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
 * by this endoint is the status.  It can be set to either ARCHIVED or DRAFT.
 */
router.patch(
  '',
  useValidate({ mode: 'body', schema: PatchAnnouncementsSchema }),
  authenticateAdmin(),
  authorize(['PTRT-ADMIN', 'PTRT-USER']),
  async (req: ExtendedRequest, res) => {
    const supportedStatuses = [
      AnnouncementStatus.Archived,
      AnnouncementStatus.Draft,
    ];
    try {
      const { user } = req;
      const data: PatchAnnouncementsType = req.body;
      const invalidRecs = data.filter(
        (d) => !supportedStatuses.includes(d.status),
      );
      if (invalidRecs.length) {
        throw new Error(
          `Only the following statuses are supported: ${supportedStatuses}`,
        );
      }
      await announcementService.patchAnnouncements(data, user.admin_user_id);
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
  authorize(['PTRT-ADMIN', 'PTRT-USER']),
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
      const announcement = await announcementService.createAnnouncement(
        data,
        user.admin_user_id,
      );
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
  authorize(['PTRT-ADMIN', 'PTRT-USER']),
  formData.parse({
    uploadDir: os.tmpdir(),
    autoClean: true,
  }),
  formData.union(),
  useUpload({ folder: APP_ANNOUNCEMENTS_FOLDER }),
  useValidate({ mode: 'body', schema: AnnouncementDataSchema }),
  async (req: ExtendedRequest, res) => {
    try {
      if (Array.isArray(req.params.id)) {
        throw new TypeError('Too many ID parameters provided');
      }
      // Request body is validated
      const { file, ...data } = req.body;
      // Create announcement
      const announcement = await announcementService.updateAnnouncement(
        req.params.id,
        data,
        req.user.admin_user_id,
      );
      res.json(announcement);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  },
);

router.get('/:id', authenticateAdmin(), async (req: Request, res) => {
  try {
    if (Array.isArray(req.params.id)) {
      throw new TypeError('Too many ID parameters provided');
    }
    const announcement = await announcementService.getAnnouncementById(
      req.params.id,
    );
    res.json(announcement);
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: 'Invalid request', error });
  }
});

export default router;
