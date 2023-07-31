import {auth} from "../services/auth-service";

const express = require("express");
import passport from 'passport';
const fileUploadRouter = express.Router();
const {getCompanies, saveFileUpload} = require('../services/file-upload-service');
fileUploadRouter.post("/",passport.authenticate('jwt', {session: false}, undefined), auth.isValidBackendToken(), async (req, res) => {
  //await saveFileUpload(req.body);
  console.log(req.body);
  res.sendStatus(200);
});
fileUploadRouter.get("/",passport.authenticate('jwt', {session: false}, undefined), auth.isValidBackendToken(), async (req, res) => {
  const companies = await getCompanies();
  res.status(200).json(companies);
});
export {fileUploadRouter};
