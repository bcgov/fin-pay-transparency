import express from 'express';
import { adminAuth } from '../services/admin-auth-service.js';
import { utils } from '../services/utils-service.js';
const router = express.Router();
router.get('/', utils.asyncHandler(adminAuth.handleGetUserInfo));
export default router;
