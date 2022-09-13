import { JavaScriptMetadataProvider } from '@mikro-orm/core';
import { Options, SqliteDriver } from '@mikro-orm/sqlite';
import { BASE_DIR } from './helpers';

const { BaseEntity4, Test3 } = require('./entities-js/index');

const config: Options = {
  entities: [Test3, BaseEntity4],
  dbName: './mikro_orm_test.db',
  baseDir: BASE_DIR,
  driver: SqliteDriver,
  metadataProvider: JavaScriptMetadataProvider,
};

export default async () => config;
