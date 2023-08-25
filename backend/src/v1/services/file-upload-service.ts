import prisma from '../prisma/prisma-client';
async function saveFileUpload(fileUpload) {
  return prisma.pay_transparency_company.create({data: {...fileUpload}});
}

async function getCompanies() {
  return prisma.pay_transparency_company.findMany();
}

export {saveFileUpload, getCompanies};
