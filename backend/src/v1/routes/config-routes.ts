import express from 'express';
import { config } from '../../config/config';
import { validateService } from '../services/validate-service';

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
