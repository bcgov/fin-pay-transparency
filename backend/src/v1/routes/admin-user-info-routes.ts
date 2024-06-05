import express from 'express';
import { adminAuth } from '../services/admin-auth-service';
import { utils } from '../services/utils-service';
const router = express.Router();
router.get('/', utils.asyncHandler(adminAuth.handleGetUserInfo));
export = router;
