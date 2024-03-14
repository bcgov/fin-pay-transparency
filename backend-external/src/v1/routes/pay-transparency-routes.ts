import express, { Request, Response } from 'express';
import { payTransparencyService } from '../services/pay-transparency-service';
import { utils } from '../../utils';

const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The id if the report
 *         naicsCode:
 *           type: string
 *       example:
 *         id: '3ab94f38-382f-4ea6-8b60-7b4b8b476721',
 *         naicsCode: "11"

 */

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
export default router;
