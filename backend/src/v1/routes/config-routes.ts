import express from 'express';
import { config } from '../../config';

const router = express.Router();

router.get('', (_, res) => {
  const settings = {
    maxUploadFileSize: config.get('server:uploadFileMaxSizeBytes'),
    reportEditDurationInDays: config.get('server:reportEditDurationInDays'),
  };

  return res.status(200).json(settings);
});

export { router };
