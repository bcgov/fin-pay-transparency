import { Router, Request, Response } from 'express';
import {
  analyticsService,
  PowerBiResourceName,
} from '../services/analytic-service';
import { utils } from '../services/utils-service';
import { useValidate } from '../middlewares/validations/validate';
import z from 'zod';

const EmbedQuerySchema = z.object({
  resources: z.array(z.nativeEnum(PowerBiResourceName)).min(1),
});
type EmbedQueryType = z.infer<typeof EmbedQuerySchema>;

const router = Router();

/** /analytics/embed?resources[]=name1&resources[]=name2 */
router.get(
  '/embed',
  useValidate({ mode: 'query', schema: EmbedQuerySchema }),
  utils.asyncHandler(
    async (
      req: Request<undefined, undefined, undefined, EmbedQueryType>,
      res: Response,
    ) => {
      const info = await analyticsService.getEmbedInfo(req.query.resources);

      return res.status(200).json(info);
    },
  ),
);

export default router;
