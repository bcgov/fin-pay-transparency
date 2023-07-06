const {DataSource} = require('typeorm');

const DB_HOST = process.env.POSTGRESQL_HOST || 'localhost';
const DB_USER = process.env.POSTGRESQL_USER || 'postgres';
const DB_PWD = process.env.POSTGRESQL_PASSWORD || 'postgres';
const DB_PORT = process.env.POSTGRESQL_PORT || 5432;
const DB_NAME = process.env.POSTGRESQL_DATABASE || 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA || 'pay_transparency';
const AppDataSource = new DataSource({
  applicationName: 'pay-transparency',
  logNotifications: true,
  connectTimeoutMS: 30000,
  idleTimeoutMillis: 30000,
  type: 'postgres',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PWD,
  database: DB_NAME,
  synchronize: false,
  minSize: 1,
  poolSize: 5,
  logging: true,
  autoLoadEntities: true,
  entities: ['./src/v1/entities/*.ts'],
  schema: DB_SCHEMA,
});
export {AppDataSource};
