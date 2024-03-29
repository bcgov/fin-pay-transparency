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

const datasourceUrl = `postgresql://${DB_USER}:${DB_PWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}&connection_limit=5`;
logger.silly(`Connecting to ${datasourceUrl}`);
config.defaults({
  environment: env,
  siteMinder_logout_endpoint: process.env.SITEMINDER_LOGOUT_ENDPOINT,
  server: {
    frontend: process.env.SERVER_FRONTEND,
    logLevel: process.env.LOG_LEVEL,
    morganFormat: 'dev',
    port: process.env.PORT || 3000,
    externalConsumerPort: process.env.EXTERNAL_CONSUMER_PORT || 3010,
    sessionPath: process.env.SESSION_PATH,
    templatePath: process.env.TEMPLATE_PATH || './src/templates',
    uploadFileMaxSizeBytes: parseFloat(process.env.UPLOAD_FILE_MAX_SIZE),
    schedulerDeleteDraftCronTime: process.env.DELETE_DRAFT_REPORT_CRON_CRONTIME,
    schedulerDeleteDraftTimeZone: process.env.DELETE_DRAFT_REPORT_CRON_TIMEZONE,
    databaseUrl: datasourceUrl,
    reportEditDurationInDays: parseInt(
      process.env.REPORT_EDIT_DURATION_IN_DAYS || '30',
    ),
    reportUnlockDurationInDays: parseInt(
      process.env.REPORT_UNLOCK_DURATION_IN_DAYS || '1',
    ),
    rateLimit: {
      enabled: process.env.IS_RATE_LIMIT_ENABLED || false, // Disable if rate limiting is not required
      windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000, // 1 minute
      limit: process.env.RATE_LIMIT_LIMIT || 100, // Limit each IP to 100 requests per `window` (here, per 1 minute)
    },
  },
  oidc: {
    keycloakUrl: process.env.KEYCLOAK_URL,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    discovery:
      process.env.KEYCLOAK_URL +
      '/realms/standard/.well-known/openid-configuration',
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
  docGenService: {
    url: process.env.DOC_GEN_SERVICE_URL || 'http://localhost:3001/api',
    apiKey: process.env.DOC_GEN_API_KEY || 'api-key',
  },
  backendExternal: {
    apiKey: process.env.BACKEND_EXTERNAL_API_KEY || 'api-key', // this the API key for internal communication between services, backend-external will pass this api key in header.
  },
});
export { config };
