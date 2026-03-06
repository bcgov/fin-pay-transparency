import { config } from './src/config/config.js';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './src/v1/prisma/schema.prisma',
  datasource: {
    url: config.get('server:databaseUrl'),
  },
  views: {
    path: './src/v1/prisma/views',
  },
});
