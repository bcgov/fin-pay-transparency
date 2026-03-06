import { config } from '../config/config.js';
import { RoleType } from '../v1/types/users.js';

export const PTRT_ADMIN_ROLE_NAME = 'PTRT-ADMIN';
export const PTRT_USER_ROLE_NAME = 'PTRT-USER';

export const EFFECTIVE_ROLES: { [key in RoleType]: RoleType[] } = {
  [PTRT_ADMIN_ROLE_NAME]: [PTRT_ADMIN_ROLE_NAME, PTRT_USER_ROLE_NAME],
  [PTRT_USER_ROLE_NAME]: [PTRT_USER_ROLE_NAME],
};

export const APP_ANNOUNCEMENTS_FOLDER = 'app/announcements';

const accessKeyId = config.get('s3:accessKeyId');
const secretAccessKey = config.get('s3:secretAccessKey');
const region = config.get('s3:region');
const endpoint = config.get('s3:endpoint');
export const S3_BUCKET = config.get('s3:bucket');

export const S3_OPTIONS = {
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  endpoint,
  forcePathStyle: true,
  region,
};
