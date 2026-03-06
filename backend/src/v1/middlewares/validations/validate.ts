import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { logger } from '../../../logger.js';

export type UseValidateOptions = {
  mode: 'body' | 'query';
  schema: ZodSchema;
};

/**
 * This middleware (for expressJS router) will use zod to validate the user inputs.
 * If there are any errors during validation, this function will return the error back to the requester.
 * useValidate will update the query/body property of the Request object with the validated object,
 * which means that you don't have to parse strings into numbers as long as the zod object knows it's supposed
 * to be a number, and there won't be any extra unknown properties.
 */
export const useValidate = ({ mode, schema }: UseValidateOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[mode];
      const results = await schema.parseAsync(data);

      // Express v5 doesn't allow you to change these properties, however, this app was originally made
      // using v4. To support v5 without a lot of rewrite, defineProperty() is used to forcibly
      // change this property. Because this was originally a v4 project, this should work fine since
      // this project is expecting a mutable property, but is not recommended for new v5 projects.
      Object.defineProperty(req, mode, {
        value: results,
        enumerable: true,
        configurable: true,
        writable: true,
      });
      next();
    } catch (error) {
      const { path, method } = req;
      const errorMessage = `${method} - ${path} - Data validation failed`;
      logger.error(errorMessage, error);
      return next(error);
    }
  };
};
