import { defineConfig } from '@mikro-orm/sqlite';
import { BASE_DIR } from './helpers';

const { BaseEntity4, Test3 } = require('./entities-js/index');

const config = defineConfig({
  entities: [Test3, BaseEntity4],
  dbName: './mikro_orm_test.db',
  baseDir: BASE_DIR,
  connect: false,
});

export default async () => config;
