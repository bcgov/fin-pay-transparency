import {CompanyEntity} from "../entities/company-entity";

const {AppDataSource} = require('../../db/database');

async function saveFileUpload(fileUpload) {
  const fileUploadRepository = await AppDataSource.getRepository(CompanyEntity);
  return fileUploadRepository.save(fileUpload);
}

async function getCompanies() {
  const fileUploadRepository = await AppDataSource.getRepository(CompanyEntity);
  return fileUploadRepository.find();
}

export {saveFileUpload, getCompanies};
