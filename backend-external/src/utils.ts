import { NextFunction, Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import { config } from './config';
import { Options } from 'swagger-jsdoc';

const backendAxios: AxiosInstance = axios.create({
  baseURL: config.get('backend:url'),
  headers: { 'x-api-key': config.get('backend:apiKey') },
});

const swaggerOpenAPIOptions: Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Pay Transparency External API',
      version: '1.0.0',
      description:
        'These api exposes endpoint to query pay transparency reports',
    },
    servers: [
      {
        url: 'http://localhost:3002/api/v1/pay-transparency',
      },
    ],
  },
  apis: [`${__dirname}/v1/routes/*.ts`],
};

export const utils = {
  asyncHandler(fn) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },
  backendAxios(): AxiosInstance {
    return backendAxios;
  },
  swaggerDocsOptions: swaggerOpenAPIOptions,
};
