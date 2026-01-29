import { Router } from 'express';
import announcementMetricsRouter from './announcement-metrics-routes.js';
import employerMetricsRouter from './employer-metrics-routes.js';
import reportsMetricsRouter from './report-metrics-routes.js';

const router = Router();

router.use(announcementMetricsRouter);
router.use(reportsMetricsRouter);
router.use(employerMetricsRouter);

export default router;
