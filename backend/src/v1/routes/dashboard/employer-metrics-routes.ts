import { Router } from 'express';
import { logger } from '../../../logger';
import { employerService } from '../../services/employer-service';

const router = Router();

/**
 * Get employer metrics
 */
router.get('/employer-metrics', async (req, res) => {
  try {
    const metrics = await employerService.getEmployerMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error(error);
    res.status(500).send({
      error: 'An error occurred while fetching the employer metrics',
    });
  }
});

export default router;
