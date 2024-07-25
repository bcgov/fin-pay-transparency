export interface IAnnouncementSearchResult {
  items: any[];
  total: number;
}
export interface IAnnouncementSearchUpdateParams {
  page: number;
  itemsPerPage: number;
  sortBy: AnnouncementSortType;
}
export interface IAnnouncementSearchParams {
  page?: number;
  itemsPerPage?: number;
  filter?: AnnouncementFilterType;
  sort?: AnnouncementSortType;
}

export enum AnnouncementKeys {
  TITLE = 'title',
  PUBLISH_DATE = 'published_on',
  EXPIRY_DATE = 'expires_on',
  STATUS = 'status',
}

//-----------------------------------------------------------------------------

type PublishedOnField = 'published_on';
type ExpiresOnField = 'expires_on';

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

export enum AnnouncementStatus {
  Published = 'PUBLISHED',
  Draft = 'DRAFT',
  Expired = 'EXPIRED',
  Deleted = 'DELETED',
}

export type StatusFilter = {
  key: string;
  operation: 'in' | 'notin';
  value: AnnouncementStatusType[];
};

export type AnnouncementFilterType = (
  | DateFilter<PublishedOnField>
  | DateFilter<ExpiresOnField>
  | StatusFilter
)[];

export type AnnouncementSortType = {
  field: 'published_on' | 'expires_on' | 'title' | 'status';
  order: 'asc' | 'desc';
}[];
