import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { logger } from '../../../logger';

export type UseValidateOptions = {
  mode: 'body' | 'query';
  schema: ZodSchema;
};

export const useValidate = ({ mode, schema }: UseValidateOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[mode];
      await schema.parseAsync(data);
      next()
    } catch (error) {
      logger.error(error);
      return next(error);
    }
  };
};
