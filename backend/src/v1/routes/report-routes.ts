import express from 'express';
import passport from 'passport';
import { auth } from '../services/auth-service';
import { reportService } from '../services/report-service';
import HttpStatus from 'http-status-codes';
import { utils } from '../services/utils-service';

const reportRouter = express.Router();

/**
 * /v1/report/published
 *
 * Get all published reports for the company associated with the logged in user.
 */
reportRouter.get(
  '/published',
  passport.authenticate('jwt', { session: false }, undefined),
  auth.isValidBackendToken(),
  async (req, res) => {
    const companyGuid = utils.getSessionUser(req)?._json?.bceid_business_guid;
    const reports = await reportService.getPublishedReports(companyGuid);
    return res.status(HttpStatus.OK).json(reports);
  },
);

export { reportRouter };
