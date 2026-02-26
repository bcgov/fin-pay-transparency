import { Router } from 'express';
import { announcementService } from '../../services/announcements-service.js';
import { logger } from '../../../logger.js';

const router = Router();

/**
 * Get dashboard metrics
 */
router.get('/announcement-metrics', async (req, res) => {
  try {
    const metrics = await announcementService.getAnnouncementMetrics();

    res.json(metrics);
  } catch (error) {
    logger.error(error);
    res.status(400).send({
      error: 'An error occurred while fetching the announcements metrics',
    });
  }
});

export default router;
