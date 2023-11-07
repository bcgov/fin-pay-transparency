import express from 'express';
import passport from 'passport';
import { auth } from "../services/auth-service";
import { codeService } from '../services/code-service';

const isValidBackendToken = auth.isValidBackendToken();
const router = express.Router();

router.get('/employee-count-range ', passport.authenticate('jwt', { session: false }), isValidBackendToken, async (req, res) => {
  res.sendStatus(200).json(codeService.getAllEmployeeCountRanges);
});

export = router;
