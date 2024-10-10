import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { logger } from '../../../logger';

export type UseValidateOptions = {
  mode: 'body' | 'query';
  schema: ZodSchema;
};

/**
 * This middleware (for expressJS router) will use zod to validate the user inputes.
 * If there are any errors during validation, this function will return the error back to the requestor.
 * useValidate will update the query/body property of the Request object with the validated object,
 * which means that you don't have to parse strings into numbers as long as the zod object knows it's supposed
 * to be a number, and there won't be any extra unknown properties.
 */
export const useValidate = ({ mode, schema }: UseValidateOptions) => {
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
      return next(error);
    }
  };
};
