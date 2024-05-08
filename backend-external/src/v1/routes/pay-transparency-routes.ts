import express, { NextFunction, Request, Response } from 'express';
import { payTransparencyService } from '../services/pay-transparency-service';
import { utils } from '../../utils';
import { logger } from '../../logger';
import { config } from '../../config';

const router = express.Router();
const validateApiKey =
  (validKey: string) =>
  (req: Request, res: Response, next: NextFunction) => {
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
 *     DeleteReportsApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-delete-reports-key
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
 *         user_comment:
 *           type: string
 *         data_constrains:
 *           type: string
 *         report_status:
 *           type: string
 *         report_start_date:
 *           type: string
 *         report_end_date:
 *           type: string
 *         create_update:
 *           type: string
 *         update_date:
 *           type: string
 *         naics_code:
 *           type: string
 *         naics_code_label:
 *           type: string
 *         company_id:
 *           type: string
 *         company_name:
 *           type: string
 *         company_province:
 *           type: string
 *         company_city:
 *           type: string
 *         company_bceid_business_guid:
 *           type: string
 *         company_country:
 *           type: string
 *         company_postal_code:
 *           type: string
 *         company_postal_address_line1:
 *           type: string
 *         company_postal_address_line2:
 *           type: string
 *         revision:
 *           type: number
 *         employee_count_range:
 *           type: string
 *         calculated_data:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/CalculatedData"
 *     Report:
 *       allOf:
 *       - $ref: "#/components/schemas/ReportItem"
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
 *             $ref: "#/components/schemas/Report"
 */

/**
 * @swagger
 * tags:
 *   name: Reports
 * /:
 *   get:
 *     summary: Get published reports with update date within a date range (date range defaults to the last 30 days)
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
 *         description: The page offset number to retrive reports - optional
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
 *         pattern: /([0-9]{4})-(?:[0-9]{2})-([0-9]{2})/
 *         required: false
 *         description: "Start date in UTC for the update date range filter (format: YYYY-MM-dd) - optional"
 *       - in: query
 *         name: endDate
 *         type: string
 *         pattern: /([0-9]{4})-(?:[0-9]{2})-([0-9]{2})/
 *         required: false
 *         description: "End date in UTC for the update date range filter (format: YYYY-MM-dd) - optional"
 *
 *
 *     responses:
 *       200:
 *         description: A paginated list of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/PaginatedReports"
 */
router.get(
  '/',
  validateApiKey(config.get('server:apiKey')),
  utils.asyncHandler(async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate?.toString();
      const endDate = req.query.endDate?.toString();
      const page = Number((req.query.page || '0')?.toString());
      const pageSize = Number((req.query.pageSize || '50')?.toString());
      if (isNaN(page) || isNaN(pageSize)) {
        return res.status(400).json({ error: 'Invalid offset or limit' });
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
 *   name: Reports
 * /reports:
 *   delete:
 *     summary: Delete reports
 *     tags: [Reports]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
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
  '/reports',
  validateApiKey(
    config.get('server:deleteReportsApiKey'),
  ),
  async (req, res) => {
    try {
      const { data } = await payTransparencyService.deleteReports(req);
      if (data.error) {
        return res.status(400).json({ message: data.message });
      }

      return res.status(200).json({ message: data.message });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

export default router;
