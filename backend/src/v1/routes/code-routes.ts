import express from 'express';
import { auth } from "../services/auth-service";

const isValidBackendToken = auth.isValidBackendToken();
const codeRouter = express.Router();
//passport.authenticate('jwt', { session: false }), isValidBackendToken,
codeRouter.get('/employee-count-range ', async (req, res) => {
  console.log("ASDFS");
  res.sendStatus(200); //.json(codeService.getAllEmployeeCountRanges);
});

export { codeRouter };

