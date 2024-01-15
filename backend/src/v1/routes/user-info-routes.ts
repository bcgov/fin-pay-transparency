import passport from 'passport';
import express from 'express';
import {auth} from "../services/auth-service";
const isValidBackendToken = auth.isValidBackendToken();
const router = express.Router();
router.get('/', passport.authenticate('jwt', {session: false}), utils.asyncHandler(isValidBackendToken), utils.asyncHandler(auth.getUserInfo));
export = router;
