import { Request } from 'express';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  limit: number;
  offset: number;
}

export type ExtendedRequest = Request & {
  user: { admin_user_id: string; userInfo: any };
};
