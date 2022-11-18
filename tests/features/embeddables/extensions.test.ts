import { EntitySchema } from '@mikro-orm/core';
import { MikroORM, SchemaGenerator } from '@mikro-orm/sqlite';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { Migrator as MongoMigrator } from '@mikro-orm/migrations-mongodb';
import { MongoSchemaGenerator, MikroORM as MongoMikroORM } from '@mikro-orm/mongodb';
import { SeedManager } from '@mikro-orm/seeder';

const User = new EntitySchema({
  name: 'User',
  properties: {
    id: { type: 'number', name: '_id', primary: true },
  },
});

test('default extensions', async () => {
  const orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
  });

  expect(orm.config.getExtension('@mikro-orm/schema-generator')).toBeInstanceOf(SchemaGenerator);
  expect(() => orm.schema).not.toThrow();

  await orm.close(true);
});

test('explicit extensions', async () => {
  const orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
    extensions: [EntityGenerator, Migrator, SeedManager],
  });

  expect(orm.config.getExtension('@mikro-orm/schema-generator')).toBeInstanceOf(SchemaGenerator);
  expect(orm.config.getExtension('@mikro-orm/entity-generator')).toBeInstanceOf(EntityGenerator);
  expect(orm.config.getExtension('@mikro-orm/migrator')).toBeInstanceOf(Migrator);
  expect(orm.config.getExtension('@mikro-orm/seeder')).toBeInstanceOf(SeedManager);
  expect(() => orm.schema).not.toThrow();
  expect(() => orm.seeder).not.toThrow();
  expect(() => orm.entityGenerator).not.toThrow();

  await orm.close(true);
});

test('explicit extensions in mongo', async () => {
  const orm = await MongoMikroORM.init({
    entities: [User],
    clientUrl: 'mongodb://localhost:27017/mikro_orm_extensions',
    extensions: [MongoMigrator],
  });

  expect(orm.config.getExtension('@mikro-orm/schema-generator')).toBeInstanceOf(MongoSchemaGenerator);
  expect(orm.config.getExtension('@mikro-orm/migrator')).toBeInstanceOf(MongoMigrator);
  expect(() => orm.schema).not.toThrow();
  expect(() => orm.migrator).not.toThrow();
  expect(() => orm.entityGenerator).toThrow();

  await orm.close(true);
});
