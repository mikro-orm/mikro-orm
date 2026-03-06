import { EntitySchema, MikroORM } from '@mikro-orm/core';
import { OracleDriver, OracleSchemaGenerator } from '@mikro-orm/oracledb';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { BASE_DIR, initORMOracleDb } from '../../bootstrap.js';
import {
  Address2,
  Author2,
  Book2,
  BookTag2,
  Configuration2,
  FooBar2,
  FooBaz2,
  FooParam2,
  Publisher2,
  Test2,
} from '../../entities-sql/index.js';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22.js';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2.js';

describe('SchemaGenerator2 [oracle]', () => {
  test('create/drop database', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [
        FooBar2,
        FooBaz2,
        Test2,
        Book2,
        Author2,
        Configuration2,
        Publisher2,
        BookTag2,
        Address2,
        BaseEntity2,
        BaseEntity22,
      ],
      dbName,
      baseDir: BASE_DIR,
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      driver: OracleDriver,
      metadataProvider: ReflectMetadataProvider,
    });

    await orm.schema.ensureDatabase();
    await orm.schema.dropDatabase(dbName);
    await orm.close(true);
  });

  test('create schema also creates the database if not exists', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      entities: [
        FooBar2,
        FooBaz2,
        Test2,
        Book2,
        Author2,
        Configuration2,
        Publisher2,
        BookTag2,
        Address2,
        BaseEntity2,
        BaseEntity22,
      ],
      dbName,
      baseDir: BASE_DIR,
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      driver: OracleDriver,
      migrations: { path: BASE_DIR + '/../temp/migrations', tableName: 'public.mikro_orm_migrations' },
      metadataProvider: ReflectMetadataProvider,
    });

    await orm.schema.create();
    const diff = await orm.schema.getUpdateSchemaSQL();
    expect(diff).toBe('');
    await orm.schema.update();
    await orm.schema.drop({ wrap: false, dropMigrationsTable: false, dropDb: true });
    await orm.close(true);

    await orm.isConnected();
  });

  test('OracleSchemaGenerator.update handles FK operations in Phase 3', async () => {
    const orm = await initORMOracleDb('mikro_orm_test_sg2', { schema: 'update' });
    const generator = orm.schema as OracleSchemaGenerator;

    await generator.execute(
      'create table "fk_target" ("id" number(11) not null, "name" varchar2(255) not null, constraint "fk_target_pkey" primary key ("id"))',
    );
    await generator.execute(
      'create table "fk_source" ("id" number(11) not null, "target_id" number(11) null, constraint "fk_source_pkey" primary key ("id"))',
    );
    await generator.execute(
      'alter table "fk_source" add constraint "fk_source_target_id_foreign" foreign key ("target_id") references "fk_target" ("id")',
    );
    await generator.execute(
      'create table "fk_adder" ("id" number(11) not null, "ref_id" number(11) null, constraint "fk_adder_pkey" primary key ("id"))',
    );

    const Target = new EntitySchema({
      name: 'FkTarget',
      tableName: 'fk_target',
      properties: {
        id: { type: 'number', primary: true },
        name: { type: 'string' },
      },
    });

    const Target2 = new EntitySchema({
      name: 'FkTarget2',
      tableName: 'fk_target2',
      properties: {
        id: { type: 'number', primary: true },
        name: { type: 'string' },
      },
    });

    const Source = new EntitySchema({
      name: 'FkSource',
      tableName: 'fk_source',
      properties: {
        id: { type: 'number', primary: true },
        target: { kind: 'm:1', entity: () => Target2, nullable: true, fieldName: 'target_id' },
      },
    });

    const NewChild = new EntitySchema({
      name: 'FkNewChild',
      tableName: 'fk_new_child',
      properties: {
        id: { type: 'number', primary: true },
        parent: { kind: 'm:1', entity: () => Target, nullable: true },
      },
    });

    const Adder = new EntitySchema({
      name: 'FkAdder',
      tableName: 'fk_adder',
      properties: {
        id: { type: 'number', primary: true },
        ref: { kind: 'm:1', entity: () => Target, nullable: true, fieldName: 'ref_id' },
      },
    });

    try {
      const orm2 = await MikroORM.init({
        entities: [
          Author2,
          Address2,
          Book2,
          BookTag2,
          Publisher2,
          Test2,
          FooBar2,
          FooBaz2,
          FooParam2,
          Configuration2,
          Target,
          Target2,
          Source,
          NewChild,
          Adder,
        ],
        dbName: orm.config.get('dbName'),
        driver: OracleDriver,
        password: 'oracle123',
        metadataProvider: ReflectMetadataProvider,
      });

      await (orm2.schema as OracleSchemaGenerator).update();
      await orm2.close(true);
    } finally {
      await generator.execute('drop table if exists "fk_adder" cascade constraints');
      await generator.execute('drop table if exists "fk_new_child" cascade constraints');
      await generator.execute('drop table if exists "fk_source" cascade constraints');
      await generator.execute('drop table if exists "fk_target2" cascade constraints');
      await generator.execute('drop table if exists "fk_target" cascade constraints');
      await orm.close(true);
    }
  });
});
