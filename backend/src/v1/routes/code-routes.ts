import express from 'express';
import passport from 'passport';
import { auth } from "../services/auth-service";
<<<<<<< HEAD
import { codeService } from '../services/code-service';
=======
import { codeService } from "../services/code-service";
>>>>>>> bb0ba5ad6a7c37899f2a4d0e4842636583f0755e

const isValidBackendToken = auth.isValidBackendToken();
const router = express.Router();

<<<<<<< HEAD
router.get('/employee-count-range ', passport.authenticate('jwt', { session: false }), isValidBackendToken, async (req, res) => {
  res.sendStatus(200).json(codeService.getAllEmployeeCountRanges);
});

export = router;
=======
router.get('/employee-count-ranges', passport.authenticate('jwt', { session: false }), isValidBackendToken, async (req, res) => {
  const body = await codeService.getAllEmployeeCountRanges()
  res.status(200).json(body);
});

export = router;

>>>>>>> bb0ba5ad6a7c37899f2a4d0e4842636583f0755e
