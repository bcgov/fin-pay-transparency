import express, { Request, Response } from 'express';
import { codeService } from '../services/code-service.js';
import { utils } from '../services/utils-service.js';

const router = express.Router();

router.get(
  '/employee-count-ranges',
  utils.asyncHandler(async (_req: Request, res: Response) => {
    const body = await codeService.getAllEmployeeCountRanges();
    res.status(200).json(body);
  }),
);

router.get(
  '/naics-codes',
  utils.asyncHandler(async (_req: Request, res: Response) => {
    const body = await codeService.getAllNaicsCodes();
    res.status(200).json(body);
  }),
);

export default router;
