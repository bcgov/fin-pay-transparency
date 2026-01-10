// Custom type for pay transparency route request
import { Request } from 'express';

export interface PayTransparencyRequest extends Request {
  query: {
    startDate?: string;
    endDate?: string;
    page?: string | number;
    pageSize?: string | number;
    [key: string]: any;
  };
}
