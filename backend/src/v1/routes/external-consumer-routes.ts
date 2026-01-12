import express, { Request, Response } from 'express';
import { z } from 'zod';
import { externalConsumerService } from '../services/external-consumer-service';
import { utils } from '../services/utils-service';
import { reportService } from '../services/report-service';
import { errorService } from '../services/error-service';

const router = express.Router();

router.get(
  '/',
  utils.asyncHandler(async (req: Request, res: Response) => {
    const querySchema = z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      offset: z.coerce.number().int().nonnegative().default(0),
      limit: z.coerce.number().int().positive().default(1000),
    });

    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
      //if offset or limit are invalid, return 400
      if (
        parseResult.error.formErrors.fieldErrors.offset ||
        parseResult.error.formErrors.fieldErrors.limit
      ) {
        return res.status(400).json({
          error: 'Invalid offset or limit',
        });
      }

      //else return 400 for any invalid query parameter
      return res.status(400).json({
        error: 'Invalid query parameters',
      });
    }
    const { startDate, endDate, offset, limit } = parseResult.data;
    try {
      const results = await externalConsumerService.exportDataWithPagination(
        startDate,
        endDate,
        offset,
        limit,
      );
      res.status(200).json(results);
    } catch (e) {
      res.json({ error: true, message: e.message });
    }
  }),
);

router.delete('/', async (req, res) => {
  try {
    const { companyName } = req.query;
    await reportService.deleteReports(companyName as string);
    res.status(200).json({ error: false, message: 'Reports deleted' });
  } catch (error) {
    res.json({ error: true, message: error.message });
  }
});

/**
 * GET /external-consumer-api/v1/reports/errors ?startDate= &endDate= &page= &limit=
 */
router.get(
  '/errors',
  utils.asyncHandler(
    async (
      req: Request<
        null,
        null,
        null,
        {
          startDate: string;
          endDate: string;
          page: string;
          limit: string;
        }
      >,
      res: Response,
    ) => {
      try {
        const results = await errorService.retrieveErrors(
          req.query.startDate,
          req.query.endDate,
          req.query.page,
          req.query.limit,
        );
        res.status(200).json(results);
      } catch (e) {
        res.json({ error: true, message: e.message });
      }
    },
  ),
);

export default router;
