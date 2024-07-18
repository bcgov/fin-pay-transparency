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
      const announcements = await getAnnouncements({
        ...query,
        filters: query.filters
          ? Array.isArray(query.filters)
            ? query.filters.map((filter) => ({
                ...filter,
                value: Array.isArray(filter.value)
                  ? filter.value
                  : [filter.value],
              }))
            : [
                {
                  ...query.filters,
                  value: Array.isArray(query.filters.value)
                    ? query.filters.value
                    : [query.filters.value],
                },
              ]
          : undefined,
        sort: query.sort
          ? Array.isArray(query.sort)
            ? query.sort
            : [query.sort]
          : undefined,
      });
      res.status(200).json(announcements);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  },
);

export default router;
