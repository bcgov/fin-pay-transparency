import { z } from 'zod';

type PublishedOnField = 'active_on';
type ExpiresOnField = 'expires_on';

export type TitleFilter = {
  key: 'title';
  operation: 'like';
  value: string;
};

export type DateFilter<T> = {
  key: T;
  operation: 'between' | 'lte' | 'gt';
  value: string | string[];
};

export type AnnouncementStatusType =
  | 'PUBLISHED'
  | 'DRAFT'
  | 'EXPIRED'
  | 'DELETED';

export enum AnnouncementStatus {
  Published = 'PUBLISHED',
  Draft = 'DRAFT',
  Expired = 'EXPIRED',
  Deleted = 'DELETED',
}

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
  field: 'active_on' | 'expires_on' | 'title' | 'status' | 'updated_date';
  order: 'asc' | 'desc';
}[];

export type FilterKeyType = 'title' | 'active_on' | 'expires_on' | 'status';

// Filter schema
const FILTER_OPERATION_SCHEMA: {
  [key in FilterKeyType]: z.ZodString | z.ZodEnum<any>;
} = {
  title: z.enum(['like'], {
    message: 'Only "like" operation is allowed',
  }),
  active_on: z.enum(['between', 'lte', 'gt'], {
    message: 'Only "between" operation is allowed',
  }),
  expires_on: z.enum(['between', 'lte', 'gt'], {
    message: 'Only "between" operation is allowed',
  }),
  status: z.enum(['in', 'notin'], {
    message: 'Only "in" or "notin" operation is allowed',
  }),
};

const STATUSES = ['PUBLISHED', 'DRAFT', 'EXPIRED', 'DELETED'] as const;
const FILTER_VALUE_SCHEMA: { [key in FilterKeyType]: any } = {
  title: z.string().optional(),
  active_on: z.string().or(z.array(z.string())).optional(),
  expires_on: z.string().or(z.array(z.string())).optional(),
  status: z.array(z.enum(STATUSES)).or(z.enum(STATUSES)).optional(),
};

const FilterItemSchema = z
  .object({
    key: z.enum(['title', 'active_on', 'expires_on', 'status'], {
      required_error: 'Missing or invalid filter key',
      message:
        'key must be one of the following values: expires_on, active_on, status',
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
  field: z.enum([
    'active_on',
    'expires_on',
    'title',
    'status',
    'updated_date',
  ]),
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
    status: z.enum(['DELETED', 'DRAFT', 'EXPIRED']),
  }),
);

export type PatchAnnouncementsType = z.infer<typeof PatchAnnouncementsSchema>;

export const AnnouncementDataSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(2000),
    active_on: z.string().optional(),
    expires_on: z.string().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT']),
    linkUrl: z.string().url({ message: 'Not a valid URL' }).optional(),
    linkDisplayName: z
      .string()
      .max(100, { message: 'Link display name is required' })
      .optional(),
    fileDisplayName: z.string().optional(),
    attachmentId: z.string().optional(),
    attachmentPath: z.string().optional(),
    file: z.any().optional(),
  })
  .refine(
    (data) => {
      if (data.attachmentId && !data.fileDisplayName) {
        return false;
      }

      if (!data.attachmentId && data.fileDisplayName) {
        return false;
      }

      return true;
    },
    {
      path: ['attachmentId', 'fileDisplayName'],
      message: 'Attachment data is invalid',
    },
  )
  .refine(
    (data) => {
      if (data.linkUrl && !data.linkDisplayName) {
        return false;
      }

      if (!data.linkUrl && data.linkDisplayName) {
        return false;
      }

      return true;
    },
    {
      path: ['linkUrl', 'linkDisplayText'],
      message: 'Invalid link data',
    },
  );

export type AnnouncementDataType = z.infer<typeof AnnouncementDataSchema>;
