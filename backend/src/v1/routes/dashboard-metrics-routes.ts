import { Router } from 'express';
import { getDashboardMetrics } from '../services/dashboard-metrics-service';
import { logger } from '../../logger';

const router = Router();

/**
 * Get dashboard metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const metrics = await getDashboardMetrics({ reportingYear: currentYear });

    res.json(metrics);
  } catch (error) {
    logger.error(error);
    res.status(400).send({
      error: 'An error occurred while fetching the dashboard metrics',
    });
  }
});

export default router;
