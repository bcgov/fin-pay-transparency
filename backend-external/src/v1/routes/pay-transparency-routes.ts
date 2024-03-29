import express, { Request, Response } from 'express';
import { payTransparencyService } from '../services/pay-transparency-service';
import { utils } from '../../utils';

const router = express.Router();
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
 *     Report:
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
 *
 *     PaginatedReports:
 *       type: object
 *       properties:
 *         totalRecords:
 *           type: number
 *           description: Total number of records found
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
 *
 */

/**
 * @swagger
 * tags:
 *   name: Reports
 * /:
 *   get:
 *     summary: Get published reports within a date range (date range defaults to the last 30 days)
 *     tags: [Reports]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: The page offset number to retrive reports - optional
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         required: false
 *         description: The number of records/reports per page (max 1000) - optional
 *       - in: query
 *         name: startDate
 *         type: date
 *         pattern: /([0-9]{4})-(?:[0-9]{2})-([0-9]{2})/
 *         required: false
 *         description: "Start date for the date range filter (format: YYYY-MM-dd) - optional"
 *       - in: query
 *         name: endDate
 *         type: string
 *         pattern: /([0-9]{4})-(?:[0-9]{2})-([0-9]{2})/
 *         required: false
 *         description: "End date for the date range filter (format: YYYY-MM-dd) - optional"
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
  utils.asyncHandler(async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate?.toString();
      const endDate = req.query.endDate?.toString();
      const offset = Number((req.query.page || '0')?.toString());
      const limit = Number((req.query.pageSize || '1000')?.toString());
      if (isNaN(offset) || isNaN(limit)) {
        return res.status(400).json({ error: 'Invalid offset or limit' });
      }
      const { status, data } =
        await payTransparencyService.getPayTransparencyData(
          startDate,
          endDate,
          offset,
          limit,
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
export default router;
