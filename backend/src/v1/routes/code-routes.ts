import express from 'express';
import passport from 'passport';
import { auth } from "../services/auth-service";
import { codeService } from "../services/code-service";

const isValidBackendToken = auth.isValidBackendToken();
const router = express.Router();

router.get('/employee-count-ranges', passport.authenticate('jwt', { session: false }), isValidBackendToken, async (req, res) => {
  const body = await codeService.getAllEmployeeCountRanges()
  res.status(200).json(body);
});

export = router;

