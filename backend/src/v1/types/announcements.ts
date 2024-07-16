import z from 'zod';
import { search } from '../routes/admin-user-info-routes';
import { fi } from '@faker-js/faker';

export type DateFilter = {
  key: 'published_date' | 'expiry_date';
  operation: 'between';
  value: string[];
};

export type AnnouncementStatusType =
  | 'Published'
  | 'Draft'
  | 'Expired'
  | 'Deleted';

export type StatusFilter = {
  key: string;
  operation: 'in' | 'notin';
  value: AnnouncementStatusType[];
};

export type AnnouncementFilterType = (DateFilter | StatusFilter)[];

export type FilterKeyType =
  | 'published_date'
  | 'expiry_date'
  | 'announcement_status';

// Filter schema
const FILTER_OPERATION_SCHEMA: {
  [key in FilterKeyType]: z.ZodString | z.ZodEnum<any>;
} = {
  published_date: z.enum(['between'], {
    message: 'Only "between" operation is allowed',
  }),
  expiry_date: z.enum(['between'], {
    message: 'Only "between" operation is allowed',
  }),
  announcement_status: z.enum(['in', 'notin'], {
    message: 'Only "in" or "notin" operation is allowed',
  }),
};

const FILTER_VALUE_SCHEMA: { [key in FilterKeyType]: any } = {
  published_date: z.array(z.string()).optional(),
  expiry_date: z.array(z.string()).optional(),
  announcement_status: z
    .array(z.enum(['Published', 'Draft', 'Expired', 'Deleted']))
    .optional(),
};

export const FilterValidationSchema = z.array(
  z
    .object({
      key: z.enum(['published_date', 'expiry_date', 'announcement_status'], {
        required_error: 'Missing or invalid filter key',
        message:
          'key must be one of the following values: expiry_date, published_date, announcement_status',
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

export const AnnouncementQuerySchema = z.object({
  search: z.string().optional(),
  filters: FilterValidationSchema.optional(),
});

export const AnnouncementQueryType = z.infer<typeof AnnouncementQuerySchema>;
