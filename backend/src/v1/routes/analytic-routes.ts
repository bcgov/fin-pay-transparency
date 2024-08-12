import { Router, Request, Response } from 'express';
import { getEmbedInfo } from '../services/analytic-service';
import { utils } from '../services/utils-service';

const router = Router();

router.get(
  '/embed',
  utils.asyncHandler(async (req: Request, res: Response) => {
    const info = await getEmbedInfo();

    return res.status(200).json(info);
  }),
);

export default router;
