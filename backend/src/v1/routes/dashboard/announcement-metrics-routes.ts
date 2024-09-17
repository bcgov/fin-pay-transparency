import { Router } from 'express';
import { getAnnouncementMetrics } from '../../services/dashboard-metrics-service';
import { logger } from '../../../logger';

const router = Router();

/**
 * Get dashboard metrics
 */
router.get('/announcement-metrics', async (req, res) => {
  try {
    const metrics = await getAnnouncementMetrics();

    res.json(metrics);
  } catch (error) {
    logger.error(error);
    res.status(400).send({
      error: 'An error occurred while fetching the announcements metrics',
    });
  }
});

export default router;
