import express, { Request, Response } from 'express';
import { externalConsumerService } from '../services/external-consumer-service';
import { utils } from '../services/utils-service';

const router = express.Router();

router.get(
  '/',
  utils.asyncHandler(async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate.toString();
      const endDate = req.query.endDate.toString();
      const offset = Number(req.query.offset.toString());
      const limit = Number(req.query.limit.toString());
      if (isNaN(offset) || isNaN(limit)) {
        return res.status(400).json({ error: 'Invalid offset or limit' });
      }
      const results = await externalConsumerService.exportDataWithPagination(
        startDate,
        endDate,
        offset,
        limit,
      );
      res.status(200).json(results);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }),
);
export default router;
