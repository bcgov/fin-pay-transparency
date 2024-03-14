import dotenv from 'dotenv';
import config from 'nconf';

dotenv.config();
const env = process.env.NODE_ENV || 'local';

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
    schedulerDeleteDraftCronTime: process.env.CRON_CRONTIME,
    schedulerDeleteDraftTimeZone: process.env.CRON_TIMEZONE,
    databaseUrl: process.env.DATABASE_URL,
    reportEditDurationInDays: parseInt(
      process.env.REPORT_EDIT_DURATION_IN_DAYS || '30',
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
