import { z } from 'zod';

export type DateFilter = {
  key: 'published_on' | 'expires_on';
  operation: 'between';
  value: string[];
};

export type AnnouncementStatusType =
  | 'PUBLISHED'
  | 'DRAFT'
  | 'EXPIRED'
  | 'DELETED';

export type StatusFilter = {
  key: string;
  operation: 'in' | 'notin';
  value: AnnouncementStatusType[];
};

export type AnnouncementFilterType = (DateFilter | StatusFilter)[];

export type FilterKeyType =
  | 'published_on'
  | 'expires_on'
  | 'status';

// Filter schema
const FILTER_OPERATION_SCHEMA: {
  [key in FilterKeyType]: z.ZodString | z.ZodEnum<any>;
} = {
  published_on: z.enum(['between'], {
    message: 'Only "between" operation is allowed',
  }),
  expires_on: z.enum(['between'], {
    message: 'Only "between" operation is allowed',
  }),
  status: z.enum(['in', 'notin'], {
    message: 'Only "in" or "notin" operation is allowed',
  }),
};

const FILTER_VALUE_SCHEMA: { [key in FilterKeyType]: any } = {
  published_on: z.array(z.string()).optional(),
  expires_on: z.array(z.string()).optional(),
  status: z
    .array(z.enum(['PUBLISHED', 'DRAFT', 'EXPIRED', 'DELETED']))
    .optional(),
};

export const FilterValidationSchema = z.array(
  z
    .object({
      key: z.enum(['published_on', 'expires_on', 'status'], {
        required_error: 'Missing or invalid filter key',
        message:
          'key must be one of the following values: expires_on, published_on, status',
      }),
      operation: z.string({
        required_error: 'Missing operation',
      }),
      value: z.any().optional(),
    })
    .refine(
      (data) => {
        const schema = FILTER_OPERATION_SCHEMA[data.key];
        const result = schema.safeParse(data.operation);
        return result.success;
      },
      {
        path: ['operation'],
        message: 'Missing or invalid operation',
      },
    )
    .refine(
      (data) => {
        return FILTER_VALUE_SCHEMA[data.key].safeParse(data.value).success;
      },
      {
        path: ['value'],
        message: 'Invalid or missing filter value',
      },
    ),
);

const AnnouncementSortSchema = z.object({
  field: z.enum(['published_on', 'expires_on', 'title', 'status']),
  order: z.enum(['asc', 'desc']),
});


export const AnnouncementQuerySchema = z.object({
  search: z.string().optional(),
  filters: FilterValidationSchema.optional(),
  limit: z.number().int().min(1, 'Limit must be greater than 0').default(10).optional(),
  offset: z.number().int().min(0, 'Offset must be a positive number').default(0).optional(),
  sort: z.array(AnnouncementSortSchema).optional(),
});

export type AnnouncementQueryType = z.infer<typeof AnnouncementQuerySchema>;
