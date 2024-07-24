import { z } from 'zod';

type PublishedOnField = 'published_on';
type ExpiresOnField = 'expires_on';

export type TitleFilter = {
  key: 'title';
  operation: 'like';
  value: string;
};

export type DateFilter<T> = {
  key: T;
  operation: 'between';
  value: string[];
};

export type AnnouncementStatusType =
  | 'PUBLISHED'
  | 'DRAFT'
  | 'EXPIRED'
  | 'DELETED';

export type StatusFilter = {
  key: 'status';
  operation: 'in' | 'notin';
  value: AnnouncementStatusType[];
};

export type AnnouncementFilterType = (
  | TitleFilter
  | DateFilter<PublishedOnField>
  | DateFilter<ExpiresOnField>
  | StatusFilter
)[];

export type AnnouncementSortType = {
  field: 'published_on' | 'expires_on' | 'title' | 'status';
  order: 'asc' | 'desc';
}[];

export type FilterKeyType = 'title' | 'published_on' | 'expires_on' | 'status';

// Filter schema
const FILTER_OPERATION_SCHEMA: {
  [key in FilterKeyType]: z.ZodString | z.ZodEnum<any>;
} = {
  title: z.enum(['like'], {
    message: 'Only "like" operation is allowed',
  }),
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

const STATUSES = ['PUBLISHED', 'DRAFT', 'EXPIRED', 'DELETED'] as const;
const FILTER_VALUE_SCHEMA: { [key in FilterKeyType]: any } = {
  title: z.string().optional(),
  published_on: z.array(z.string()).optional(),
  expires_on: z.array(z.string()).optional(),
  status: z.array(z.enum(STATUSES)).or(z.enum(STATUSES)).optional(),
};

const FilterItemSchema = z
  .object({
    key: z.enum(['title', 'published_on', 'expires_on', 'status'], {
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
  );

const AnnouncementSortSchema = z.object({
  field: z.enum(['published_on', 'expires_on', 'title', 'status']),
  order: z.enum(['asc', 'desc']),
});

export const AnnouncementQuerySchema = z.object({
  filters: z.array(FilterItemSchema).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be greater than 0')
    .default(10)
    .optional(),
  offset: z.coerce
    .number()
    .int()
    .min(0, 'Offset must be a positive number')
    .default(0)
    .optional(),
  sort: z
    .array(AnnouncementSortSchema, { message: 'Not a valid sort' })
    .optional(),
});

export type AnnouncementQueryType = z.infer<typeof AnnouncementQuerySchema>;

export const PatchAnnouncementsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    status: z.enum(['DELETED']),
  }),
);

export type PatchAnnouncementsType = z.infer<typeof PatchAnnouncementsSchema>;

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  published_on: z.string().optional(),
  expires_on: z.string().optional(),
  status: z.enum(['PUBLISHED', 'DRAFT']),
});

export type CreateAnnouncementType = z.infer<typeof CreateAnnouncementSchema>;
