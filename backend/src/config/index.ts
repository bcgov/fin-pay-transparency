import dotenv from 'dotenv';
import config from 'nconf';
import { logger } from '../logger';

dotenv.config();
const env = process.env.NODE_ENV || 'local';
const DB_HOST = process.env.POSTGRESQL_HOST || 'localhost';
const DB_USER = process.env.POSTGRESQL_USER || 'postgres';
const DB_PWD = encodeURIComponent(
  process.env.POSTGRESQL_PASSWORD || 'postgres',
);
const DB_PORT = process.env.POSTGRESQL_PORT || 5432;
const DB_NAME = process.env.POSTGRESQL_DATABASE || 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA || 'pay_transparency';
const DB_CONNECTION_POOL_SIZE = process.env.DB_CONNECTION_POOL_SIZE || 5;

const datasourceUrl = `postgresql://${DB_USER}:${DB_PWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}&connection_limit=${DB_CONNECTION_POOL_SIZE}`;
logger.silly(`Connecting to ${datasourceUrl}`);
config.defaults({
  environment: env,
  siteMinder_logout_endpoint: process.env.SITEMINDER_LOGOUT_ENDPOINT,
  server: {
    hostName: process.env.HOSTNAME || 'localhost', // Available by default to each pod in OpenShift.
    openshiftEnv: process.env.OPENSHIFT_ENV || 'local', // Set by HELM values-$env.yaml
    adminFrontend: process.env.SERVER_ADMIN_FRONTEND,
    adminFrontendUrl: process.env.ADMIN_FRONTEND_URL,
    adminInvitationDurationInHours: parseInt(
      process.env.ADMIN_INVITATION_DURATION_IN_HOURS || '72',
    ),
    frontend: process.env.SERVER_FRONTEND,
    logLevel: process.env.LOG_LEVEL,
    morganFormat: 'dev',
    port: process.env.PORT || 3000,
    externalConsumerPort: process.env.EXTERNAL_CONSUMER_PORT || 3010,
    adminPort: process.env.ADMIN_PORT || 3004,
    sessionPath: process.env.SESSION_PATH,
    adminSessionPath: process.env.ADMIN_SESSION_PATH,
    templatePath: process.env.TEMPLATE_PATH || './src/templates',
    uploadFileMaxSizeBytes: parseFloat(process.env.UPLOAD_FILE_MAX_SIZE),
    schedulerDeleteDraftCronTime: process.env.DELETE_DRAFT_REPORT_CRON_CRONTIME,
    schedulerLockReportCronTime: process.env.LOCK_REPORT_CRON_CRONTIME,
    emailExpiringAnnouncementsCronTime:
      process.env.EMAIL_EXPIRING_ANNOUNCEMENTS_CRON_CRONTIME,
    schedulerTimeZone: process.env.REPORTS_SCHEDULER_CRON_TIMEZONE,
    schedulerExpireAnnountmentsCronTime:
      process.env.EXPIRE_ANNOUNCEMENTS_CRON_CRONTIME,
    deleteAnnouncementsCronTime: process.env.DELETE_ANNOUNCEMENTS_CRON_CRONTIME,
    enableEmailExpiringAnnouncements:
      process.env.ENABLE_EMAIL_EXPIRING_ANNOUNCEMENTS?.toUpperCase() == 'TRUE',
    deleteAnnouncementsDurationInDays: parseInt(
      process.env.DELETE_ANNOUNCEMENTS_DURATION_IN_DAYS || '90',
    ),
    databaseUrl: datasourceUrl,
    firstYearWithPrevReportingYearOption: parseInt(
      process.env.FIRST_YEAR_WITH_PREV_REPORTING_YEAR_OPTION || '2025',
    ),
    reportEditDurationInDays: parseInt(
      process.env.REPORT_EDIT_DURATION_IN_DAYS || '30',
    ),
    reportUnlockDurationInDays: parseInt(
      process.env.REPORT_UNLOCK_DURATION_IN_DAYS || '2',
    ),
    userErrorLogging: {
      isEnabled:
        process.env.IS_USER_ERROR_LOGGING_ENABLED?.toUpperCase() == 'TRUE' ||
        false,
      deleteScheduleCronTime: process.env.DELETE_USER_ERRORS_CRON_CRONTIME,
      numMonthsOfUserErrorsToKeep:
        process.env.NUM_MONTHS_OF_USER_ERRORS_TO_KEEP || 6,
    },
    rateLimit: {
      enabled: process.env.IS_RATE_LIMIT_ENABLED || false, // Disable if rate limiting is not required
      windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000, // 1 minute
      limit: process.env.RATE_LIMIT_LIMIT || 100, // Limit each IP to 100 requests per `window` (here, per 1 minute)
    },
    retries: {
      minTimeout: 1000,
    },
    reportRichText: {
      maxParagraphs:
        parseInt(process.env.REPORT_RICH_TEXT_MAX_PARAGRAPHS) || 100,
      maxItemsPerList:
        parseInt(process.env.REPORT_RICH_TEXT_MAX_ITEMS_PER_LIST) || 30,
    },
  },
  oidc: {
    adminKeycloakUrl: process.env.ADMIN_KEYCLOAK_URL,
    adminClientId: process.env.ADMIN_KEYCLOAK_CLIENT_ID,
    adminClientSecret: process.env.ADMIN_KEYCLOAK_CLIENT_SECRET,
    adminDiscovery:
      process.env.ADMIN_KEYCLOAK_URL +
      '/realms/standard/.well-known/openid-configuration',
    keycloakUrl: process.env.KEYCLOAK_URL,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    discovery:
      process.env.KEYCLOAK_URL +
      '/realms/standard/.well-known/openid-configuration',
    logoutUrl: process.env.LOGOUT_ENDPOINT,
  },
  tokenGenerate: {
    privateKey: process.env.PRIVATE_KEY,
    publicKey: process.env.PUBLIC_KEY,
    audience: process.env.AUDIENCE,
    issuer: process.env.ISSUER,
  },
  bceidWsIntegration: {
    auth: {
      username: process.env.BCEID_WS_BASIC_AUTH_USERNAME,
      password: process.env.BCEID_WS_BASIC_AUTH_PASSWORD,
    },
    url: process.env.BCEID_WS_URL,
    onlineServiceId: process.env.BCEID_WS_ONLINE_SERVICE_ID,
  },
  cssAppApiIntegration: {
    auth: {
      username: process.env.CSS_APP_API_CLIENT_ID,
      password: process.env.CSS_APP_API_CLIENT_SECRET,
    },
    integrationId: process.env.CSS_APP_API_INTEGRATION_ID,
    environment: process.env.CSS_APP_API_ENVIRONMENT,
  },
  docGenService: {
    url: process.env.DOC_GEN_SERVICE_URL || 'http://localhost:3001/api',
    apiKey: process.env.DOC_GEN_API_KEY || 'api-key',
  },
  backendExternal: {
    apiKey: process.env.BACKEND_EXTERNAL_API_KEY || 'api-key', // this the API key for internal communication between services, backend-external will pass this api key in header.
  },
  ches: {
    enabled: process.env.CHES_ENABLED || false, // Enable if CHES is required, helps in local not to set up CHES
    tokenUrl: process.env.CHES_TOKEN_URL,
    clientId: process.env.CHES_CLIENT_ID,
    clientSecret: process.env.CHES_CLIENT_SECRET,
    apiUrl: process.env.CHES_API_URL,
    emailRecipients: process.env.CHES_EMAIL_RECIPIENTS?.split(','), // comma separated email addresses
  },
  entra: {
    clientId: process.env.ENTRA_APP_CLIENT_ID,
    clientSecret: process.env.ENTRA_APP_CLIENT_SECRET,
    tenantId: process.env.ENTRA_APP_TENANT_ID,
  },
  powerbi: {
    powerBiUrl: process.env.BACKEND_POWERBI_URL,
    analytics: {
      workspaceId: process.env.POWERBI_ANALYTICS_WORKSPACE_ID,
      analyticsId: process.env.POWERBI_ANALYTICS_REPORT_ID,
    },
  },
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION || 'ca-central-1',
    endpoint: `https://${process.env.S3_ENDPOINT}`,
    bucket: process.env.S3_BUCKET_NAME,
  },
});

export { config };
