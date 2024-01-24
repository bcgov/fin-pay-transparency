import express from 'express';
import { auth } from '../services/auth-service';
import { utils } from '../services/utils-service';
const router = express.Router();
router.get('/', utils.asyncHandler(auth.getUserInfo));
export = router;
