const express = require("express");

const fileUploadRouter = express.Router();
const {getCompanies, saveFileUpload} = require('../services/file-upload-service');
fileUploadRouter.post("/", async (req, res) => {
  //await saveFileUpload(req.body);
  console.log(req.body);
  res.sendStatus(200);
});
fileUploadRouter.get("/", async (req, res) => {
  const companies = await getCompanies();
  res.status(200).json(companies);
});
export {fileUploadRouter};
