import express, { Request, Response } from 'express';
import { payTransparencyService } from '../services/pay-transparency-service';
import { utils } from '../../utils';

const router = express.Router();

router.get('/', utils.asyncHandler(async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate.toString();
    const endDate = req.query.endDate.toString();
    const offset = Number(req.query.offset.toString());
    const limit = Number(req.query.limit.toString());
    if (isNaN(offset) || isNaN(limit)) {
      return res.status(400).json({ error: 'Invalid offset or limit' });
    }
    const { status, data } = await payTransparencyService.getPayTransparencyData(startDate, endDate, offset, limit);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}));
