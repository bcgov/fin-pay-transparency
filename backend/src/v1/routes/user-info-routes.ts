import {config} from '../../config';
import passport from 'passport';
import express from 'express';
import {auth} from "../services/auth-service";
import {body, validationResult} from 'express-validator';
const isValidBackendToken = auth.isValidBackendToken();
const router = express.Router();
router.get('/', passport.authenticate('jwt', {session: false}), isValidBackendToken, auth.getUserInfo);
export = router;
