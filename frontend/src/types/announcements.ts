export type Announcement = {
  announcement_id: string;
  title: string;
  description: string;
  created_date: string;
  updated_date: string;
  created_by: string;
  updated_by: string;
  active_on: string;
  expires_on: string;
  status: string;
  announcement_resource: AnnouncementResource[];
};
export type AnnouncementResource = {
  announcement_id: string;
  announcement_resource_id: string;
  created_by: string;
  created_date: string;
  display_name: string;
  resource_type: AnnouncementResourceType;
  resource_url: string;
  update_date: string;
  updated_by: string;
};
export type AnnouncementResourceType = 'LINK' | 'ATTACHMENT';

export interface IAnnouncementSearchResult {
  items: Announcement[];
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
  PUBLISH_DATE = 'active_on',
  EXPIRY_DATE = 'expires_on',
  STATUS = 'status',
}

//-----------------------------------------------------------------------------

type PublishedOnField = 'active_on';
type ExpiresOnField = 'expires_on';

export type DateFilter<T> = {
  key: T;
  operation: 'between' | 'lte' | 'gt';
  value: string | string[];
};

export enum AnnouncementStatus {
  Published = 'PUBLISHED',
  Draft = 'DRAFT',
  Expired = 'EXPIRED',
  Archived = 'ARCHIVED',
}

export type StatusFilter = {
  key: string;
  operation: 'in' | 'notin';
  value: AnnouncementStatus[];
};

export type AnnouncementFilterType = (
  | DateFilter<PublishedOnField>
  | DateFilter<ExpiresOnField>
  | StatusFilter
)[];

export type AnnouncementSortType = {
  field: 'active_on' | 'expires_on' | 'title' | 'status' | 'updated_date';
  order: 'asc' | 'desc';
}[];
