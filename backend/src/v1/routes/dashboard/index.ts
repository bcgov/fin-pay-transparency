import { Router } from 'express';
import announcementMetricsRouter from './announcement-metrics-routes';
import employerMetricsRouter from './employer-metrics-routes';
import reportsMetricsRouter from './report-metrics-routes';

const router = Router();

router.use(announcementMetricsRouter);
router.use(reportsMetricsRouter);
router.use(employerMetricsRouter);

export default router;
