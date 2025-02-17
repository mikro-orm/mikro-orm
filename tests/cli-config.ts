import { defineConfig } from '@mikro-orm/sqlite';
import { BASE_DIR } from './helpers.js';
import { Test4 } from './entities-schema/Test4.js';

const config = defineConfig({
  entities: [Test4],
  dbName: './mikro_orm_test.db',
  baseDir: BASE_DIR,
  connect: false,
});

export default async () => config;
