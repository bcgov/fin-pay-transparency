import express from 'express';
import { publicAuth } from '../services/public-auth-service';
import { utils } from '../services/utils-service';
const router = express.Router();
router.get('/', utils.asyncHandler(publicAuth.handleGetUserInfo));
export = router;
