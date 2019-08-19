import { BASE_DIR } from './bootstrap';
import { JavaScriptMetadataProvider } from '../lib';
import { SqliteDriver } from '../lib/drivers/SqliteDriver';

const { BaseEntity4, Test3 } = require('./entities-js');

export = {
  entities: [Test3, BaseEntity4],
  dbName: './mikro_orm_test.db',
  baseDir: BASE_DIR,
  driver: SqliteDriver,
  metadataProvider: JavaScriptMetadataProvider,
};
