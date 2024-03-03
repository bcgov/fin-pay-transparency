import { NextFunction, Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import { config } from './config';
const backendAxios: AxiosInstance = axios.create({
  baseURL: config.get('backend:url'),
  headers: { 'x-api-key': config.get('backend:apiKey') }
});
export const utils = {
  asyncHandler(fn) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },
  backendAxios(): AxiosInstance {
    return backendAxios;
  }
};
