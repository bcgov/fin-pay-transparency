import { z } from 'zod';

export type EmployerMetrics = {
  num_employers_logged_on_to_date: number;
};

/* Get Employer - Filter */

export enum EmployerKeyEnum {
  Name = 'company_name',
  Year = 'create_year',
}
const EmployerNameFilterSchema = z
  .object({
    key: z.literal(EmployerKeyEnum.Name),
    operation: z.literal('like'),
    value: z.string(),
  })
  .required();

const EmployerYearFilterSchema = z
  .object({
    key: z.literal(EmployerKeyEnum.Year),
    operation: z.literal('in'),
    value: z.array(z.coerce.number()),
  })
  .required();

const EmployerFilterSchema = z.array(
  z.discriminatedUnion('key', [
    EmployerNameFilterSchema,
    EmployerYearFilterSchema,
  ]),
);

export type EmployerFilterType = z.infer<typeof EmployerFilterSchema>;

/* Get Employer - Sort */

const EmployerSortSchema = z.array(
  z.object({
    field: z.enum(['create_date', 'company_name']),
    order: z.enum(['asc', 'desc']),
  }),
);
export type EmployerSortType = z.infer<typeof EmployerSortSchema>;

/* Get Employer - Query */

export const GetEmployerQuerySchema = z
  .object({
    filter: EmployerFilterSchema,
    sort: EmployerSortSchema,
    limit: z.coerce.number(),
    offset: z.coerce.number(),
  })
  .optional();

export type GetEmployerQueryType = z.infer<typeof GetEmployerQuerySchema>;

/* Get Employer - Results*/

export type Employer = {
  company_name: string;
  create_date: Date;
};

export interface IEmployerSearchResult {
  employers: Employer[];
  total: number;
  totalPages: number;
  offset: number;
  limit: number;
}
