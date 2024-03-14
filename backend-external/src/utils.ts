import { NextFunction, Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import { config } from './config';

const backendAxios: AxiosInstance = axios.create({
  baseURL: config.get('backend:url'),
  headers: { 'x-api-key': config.get('backend:apiKey') },
});

export const utils = {
  asyncHandler(fn) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },
  backendAxios(): AxiosInstance {
    return backendAxios;
  },
  swaggerDocsOptions: {
    definition: {
      openapi: '3.1.0',
      info: {
        title: 'Pay Transparency External API',
        version: '0.1.0',
        description:
          'These api exposes endpoint to read pay transparency reports',
      },
      servers: [
        {
          url: 'http://localhost:3002',
        },
      ],
    },
    apis: ['./v1/routes/*.ts'],
  },
};
