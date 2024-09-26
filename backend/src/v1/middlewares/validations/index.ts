import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { logger } from '../../../logger';

export type UseValidateOptions = {
  mode: 'body' | 'query';
  schema: ZodSchema;
};

export const useValidate = ({ mode, schema, }: UseValidateOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[mode];
      const results = await schema.parseAsync(data);
      req[mode] = results;
      next();
    } catch (error) {
      const { path, method } = req;
      const errorMessage = `${method} - ${path} - Data validation failed`;
      logger.error(errorMessage, error);
      return next({ errorMessage, error });
    }
  };
};
