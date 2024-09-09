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
  announcement_id?: string;
  announcement_resource_id: string;
  created_by?: string;
  created_date?: string;
  display_name: string;
  attachment_file_id?: string;
  resource_type: AnnouncementResourceType;
  resource_url?: string;
  update_date?: string;
  updated_by?: string;
  //This property isn't supported on the backend, but is used in the frontend
  //to support AnnouncementResources in which the file hasn't yet been uploaded
  //to the backend.  In this case, the not-yet-uploaded file is saved directly
  //to the announcement_resource_file property, and components
  //that need to present a download link do so from the file saved here.
  announcement_resource_file?: File;
};

export enum AnnouncementResourceType {
  LINK = 'LINK',
  ATTACHMENT = 'ATTACHMENT',
}

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
  field: 'active_on' | 'expires_on' | 'title' | 'status' | 'updated_date';
  order: 'asc' | 'desc';
}[];

export type AnnouncementFormValue = Pick<
  Announcement,
  'title' | 'description' | 'active_on' | 'expires_on' | 'status'
> & {
  announcement_id?: string;
  no_expiry?: boolean;
  linkUrl?: string;
  linkDisplayName?: string;
  fileDisplayName?: string;
  attachmentId?: string;
  attachment?: File;
  file_resource_id?: string;
};

export enum AnnouncementFormMode {
  CREATE = 'create',
  EDIT = 'edit',
}
