import express, { NextFunction, Request, Response } from 'express';
import { payTransparencyService } from '../services/pay-transparency-service';
import { utils } from '../../utils';
import { logger } from '../../logger';
import { config } from '../../config';
import { query } from 'express-validator';

interface ExternalReportRequest extends Request {
  query: {
    startDate?: string;
    endDate?: string;
    page?: string;
    pageSize?: string;
  };
}

const router = express.Router();
const validateApiKey =
  (validKey: string) => (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('x-api-key');
    if (apiKey) {
      if (validKey === apiKey) {
        next();
      } else {
        logger.error('Invalid API Key');
        res.status(401).send({ message: 'Invalid API Key' });
      }
    } else {
      logger.error('API Key is missing in the request header');
      res.status(400).send({
        message: 'API Key is missing in the request header',
      });
    }
  };

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 *   schemas:
 *     CalculatedData:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *         is_suppressed:
 *           type: boolean
 *         calculation_code:
 *           type: string
 *     ReportItem:
 *       type: object
 *       properties:
 *         report_id:
 *           type: string
 *         user_id:
 *           type: string
 *         create_date:
 *           type: string
 *         update_date:
 *           type: string
 *         admin_modified_date:
 *           type: string
 *         admin_modified_reason:
 *           type: string
 *         report_unlock_date:
 *           type: string
 *         report_status:
 *           type: string
 *         revision:
 *           type: number
 *         create_user:
 *           type: string
 *         update_user:
 *           type: string
 *         reporting_year:
 *           type: string
 *         report_start_date:
 *           type: string
 *         report_end_date:
 *           type: string
 *         naics_code:
 *           type: string
 *         naics_code_label:
 *           type: string
 *         employee_count_range_id:
 *           type: string
 *         employee_count_range:
 *           type: string
 *         user_comment:
 *           type: string
 *         data_constrains:
 *           type: string
 *         company_id:
 *           type: string
 *         company_bceid_business_guid:
 *           type: string
 *         company_name:
 *           type: string
 *         company_province:
 *           type: string
 *         company_city:
 *           type: string
 *         company_country:
 *           type: string
 *         company_postal_code:
 *           type: string
 *         company_postal_address_line1:
 *           type: string
 *         company_postal_address_line2:
 *           type: string
 *         calculated_data:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/CalculatedData"
 *
 *     PaginatedReports:
 *       type: object
 *       properties:
 *         totalRecords:
 *           type: number
 *           description: total number of records in the database
 *         page:
 *           type: number
 *           description: Current page offset
 *         pageSize:
 *           type: number
 *           description: Number of reports retrieved per request
 *         records:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ReportItem"
 *
 *     Error:
 *       type: object
 *       properties:
 *         user_error_id:
 *           type:string
 *         user_id:
 *           type:string
 *         company_id:
 *           type:string
 *         error:
 *           type:string
 *         create_date:
 *           type:string
 *           format:date-time
 *         pay_transparency_company:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/Company"
 *
 *     Company:
 *       type: object
 *       properties:
 *         company_id:
 *           type: string
 *         company_name:
 *           type: string
 *         province:
 *           type: string
 *         city:
 *           type: string
 *         bceid_business_guid:
 *           type: string
 *         country:
 *           type: string
 *         postal_code:
 *           type: string
 *         postal_address_line1:
 *           type: string
 *         postal_address_line2:
 *           type: string
 *         create_date:
 *           type:string
 *           format:date-time
 *         update_date:
 *           type:string
 *           format:date-time
 *
 *     PaginatedErrors:
 *       type: object
 *       properties:
 *         totalRecords:
 *           type: number
 *           description: total number of records in the database
 *         page:
 *           type: number
 *           description: Current page offset
 *         pageSize:
 *           type: number
 *           description: Number of reports retrieved per request
 *         records:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/Error"
 */

/**
 * @swagger
 * tags:
 *   name: Reports
 * /reports:
 *   get:
 *     summary: Get published reports with update date within a date range (date range defaults to the last 30 days)
 *     description: update_date is the date when the report was created or last modified by either a user or admin.
 *     tags: [Reports]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 0
 *         required: false
 *         description: The page offset number to retrieve reports - optional
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         required: false
 *         description: The number of records/reports per page (max 50, default 50) - optional
 *       - in: query
 *         name: startDate
 *         type: date
 *         pattern: /([0-9]{4})-(?:[0-9]{2})-([0-9]{2})\s([0-9]{2}):([0-9]{2})/
 *         required: false
 *         description: "Start date in UTC for the update date range filter (format: YYYY-MM-dd HH:mm, default -31 days ) - optional"
 *       - in: query
 *         name: endDate
 *         type: string
 *         pattern: /([0-9]{4})-(?:[0-9]{2})-([0-9]{2})\s([0-9]{2}):([0-9]{2})/
 *         required: false
 *         description: "End date in UTC for the update date range filter (format: YYYY-MM-dd HH:mm, default now) - optional"
 *
 *
 *     responses:
 *       200:
 *         description: A paginated list of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: "#/components/schemas/PaginatedReports"
 */
router.get(
  '/',
  validateApiKey(config.get('server:apiKey')),
  query('startDate').isISO8601().withMessage('Invalid start date format'),
  query('endDate').isISO8601().withMessage('Invalid end date format'),
  utils.asyncHandler(async (req: ExternalReportRequest, res: Response) => {
    try {
      const startDate = req.query.startDate?.toString();
      const endDate = req.query.endDate?.toString();
      const page = Number((req.query.page || '0')?.toString());
      let pageSize = Number((req.query.pageSize || '50')?.toString());
      if (Number.isNaN(page) || Number.isNaN(pageSize)) {
        return res.status(400).json({ error: 'Invalid offset or limit' });
      }

      const maxPageSize = 50;
      if (pageSize > maxPageSize || pageSize <= 0) {
        pageSize = maxPageSize;
      }

      const { status, data } =
        await payTransparencyService.getPayTransparencyData(
          startDate,
          endDate,
          page * pageSize,
          pageSize,
        );

      if (data.error) {
        return res.status(400).json({ error: data.message });
      }
      res.status(status).json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }),
);

/**
 * @swagger
 * tags:
 *   name: End to end testing utils
 *   description: This endpoint is used by developers to teardown test data after end to end tests. Only developers can access this endpoint
 * /reports:
 *   delete:
 *     summary: Delete reports
 *     tags: ["End to end testing utils"]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: companyName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully deleted reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.delete(
  '/',
  validateApiKey(config.get('server:deleteReportsApiKey')),
  async (req, res) => {
    try {
      if (!req.query.companyName) {
        res
          .status(404)
          .json({ message: 'companyName query parameter is missing.' });
        return;
      }

      const { data } = await payTransparencyService.deleteReports(req);
      if (data.error) {
        res.status(400).json({ message: data.message });
        return;
      }

      res.status(200).json({ message: data.message });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

/**
 * @swagger
 * tags:
 *   name: Errors
 * /reports/errors:
 *   get:
 *     summary: Get errors of submitted reports created within a period of time (date range defaults to the last 30 full UTC days, which does not including today)
 *     tags: [Errors]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 0
 *         required: false
 *         description: The page offset number to retrieve errors - optional
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         required: false
 *         description: The number of records per page (max 1000, default 1000) - optional
 *       - in: query
 *         name: startDate
 *         type: date
 *         required: false
 *         description: "Start date (in UTC or ISO-8601) to retrieve records (format: YYYY-MM-dd HH:mm, default -31 days ) - optional"
 *       - in: query
 *         name: endDate
 *         type: string
 *         required: false
 *         description: "End date (in UTC or ISO-8601) to retrieve records (format: YYYY-MM-dd HH:mm, default now) - optional"
 *
 *
 *     responses:
 *       200:
 *         description: A paginated list of errors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/PaginatedErrors"
 */
router.get(
  '/errors',
  validateApiKey(config.get('server:errorReportsApiKey')),
  utils.asyncHandler(
    async (
      req: Request<
        null,
        null,
        null,
        { startDate: string; endDate: string; page: string; pageSize: string }
      >,
      res: Response,
    ) => {
      try {
        const { status, data } = await payTransparencyService.getReportErrors(
          req.query.startDate,
          req.query.endDate,
          req.query.page,
          req.query.pageSize,
        );

        if (data.error) {
          return res.status(400).json({ error: data.message });
        }
        res.status(status).json(data);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    },
  ),
);

export default router;
