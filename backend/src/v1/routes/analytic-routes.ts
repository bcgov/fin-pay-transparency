import { Router, Request, Response } from 'express';
import { getEmbedInfo } from '../services/analytic-service';
import { utils } from '../services/utils-service';

const router = Router();

router.get(
  '/embed/:resourceName',
  utils.asyncHandler(
    async (req: Request<{ resourceName: string }>, res: Response) => {
      const info = await getEmbedInfo(req.params.resourceName);

      return res.status(200).json(info);
    },
  ),
);

export default router;
