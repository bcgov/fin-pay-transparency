import express from "express";
import passport from 'passport';
import { auth } from "../services/auth-service";
import { getCompanies } from '../services/file-upload-service';
const multer = require('multer');
const upload = multer();

const fileUploadRouter = express.Router();
fileUploadRouter.post("/",
  passport.authenticate('jwt', { session: false }, undefined),
  auth.isValidBackendToken(),
  upload.single("file"),
  async (req, res) => {
    //await saveFileUpload(req.body);
    console.log("submission body:");
    console.log(req.body);
    res.sendStatus(200);
  });
fileUploadRouter.get("/", passport.authenticate('jwt', { session: false }, undefined), auth.isValidBackendToken(), async (req, res) => {
  const companies = await getCompanies();
  res.status(200).json(companies);
});
export { fileUploadRouter };

