import express, { Request, Response } from 'express';
import passport from 'passport';
import { auth } from '../services/auth-service';
import { reportService, enumReportStatus } from '../services/report-service';
import HttpStatus from 'http-status-codes';
import { utils } from '../services/utils-service';

const reportRouter = express.Router();

/**
 * /api/v1/report/?status=<string>
 *     Get all published reports for the company associated with the logged in user.
 */
reportRouter.get(
  '/',
  passport.authenticate('jwt', { session: false }, undefined),
  auth.isValidBackendToken(),
  async (
    req: Request<null, null, null, { status: enumReportStatus }>,
    res: Response,
  ) => {
    // verifiy business guid
    const businessGuid = utils.getSessionUser(req)?._json?.bceid_business_guid;
    if (!businessGuid)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();

    // params
    const status = req.query.status;

    // get reports by status if status param is provided
    if (status in enumReportStatus) {
      const reports = await reportService.getReportsByStatus(
        businessGuid,
        status,
      );
      return res.status(HttpStatus.OK).json(reports);
    }

    // if not enough information provided, then it is a bad request
    return res.status(HttpStatus.BAD_REQUEST).end();
  },
);

export { reportRouter };
