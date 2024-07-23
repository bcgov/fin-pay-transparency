export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  limit: number;
  offset: number;
}
