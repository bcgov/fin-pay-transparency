import { Router } from 'express';
import { useValidate } from '../middlewares/validations';
import {
  AnnouncementQuerySchema,
  AnnouncementQueryType,
} from '../types/announcements';
import { logger } from '../../logger';
import { getAnnouncements } from '../services/announcements-service';

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

export default router;
