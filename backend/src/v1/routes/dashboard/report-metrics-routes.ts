import { Router } from 'express';
import { adminReportService } from '../../services/admin-report-service';
import { logger } from '../../../logger';

const router = Router();

/**
 * Get reports metrics
 */
router.get('/reports-metrics', async (req, res) => {
  try {
    const reportingYear = new Date().getFullYear();
    const metrics = await adminReportService.getReportsMetrics({ reportingYear });

    res.json(metrics);
  } catch (error) {
    logger.error(error);
    res.status(400).send({
      error: 'An error occurred while fetching the reports metrics',
    });
  }
});

export default router;
