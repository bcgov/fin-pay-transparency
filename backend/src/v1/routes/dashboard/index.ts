import { Router } from 'express';
import announcementMetricsRouter from './announcement-metrics-routes';
import reportsMetricsRouter from './report-metrics-routes';

const router = Router();

router.use(announcementMetricsRouter);
router.use(reportsMetricsRouter);

export default router;
