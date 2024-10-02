import { Router, Request, Response } from 'express';
import { employerService } from '../services/employer-service';
import { utils } from '../services/utils-service';
import { useValidate } from '../middlewares/validations';
import {
  GetEmployerQuerySchema,
  GetEmployerQueryType,
} from '../types/employers';

const router = Router();

/** /v1/employers?limit=&offset=&sort=&filter= */
router.get(
  '/',
  useValidate({ mode: 'query', schema: GetEmployerQuerySchema }),
  utils.asyncHandler(
    async (
      req: Request<undefined, undefined, undefined, GetEmployerQueryType>,
      res: Response,
    ) => {
      const info = await employerService.getEmployer(
        req.query.limit,
        req.query.offset,
        req.query.sort,
        req.query.filter,
      );

      return res.status(200).json(info);
    },
  ),
);

export default router;
