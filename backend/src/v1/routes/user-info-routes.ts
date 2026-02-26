import express from 'express';
import { publicAuth } from '../services/public-auth-service.js';
import { utils } from '../services/utils-service.js';
const router = express.Router();
router.get('/', utils.asyncHandler(publicAuth.handleGetUserInfo));
export default router;
