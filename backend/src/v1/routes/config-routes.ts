import express from 'express';
import { config } from '../../config/config.js';
import { validateService } from '../services/validate-service.js';

const router = express.Router();

router.get('', (_, res) => {
  const settings = {
    maxUploadFileSize: config.get('server:uploadFileMaxSizeBytes'),
    reportEditDurationInDays: config.get('server:reportEditDurationInDays'),
    reportingYearOptions: validateService.getValidReportingYears(),
    deleteAnnouncementsDurationInDays: config.get(
      'server:deleteAnnouncementsDurationInDays',
    ),
  };

  res.status(200).json(settings);
});

export { router };
