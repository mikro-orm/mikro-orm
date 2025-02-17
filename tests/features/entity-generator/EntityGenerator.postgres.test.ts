import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { DatabaseTable } from '@mikro-orm/knex';
import { initORMPostgreSql } from '../../bootstrap.js';

describe('EntityGenerator', () => {

  test('generate entities from schema [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('postgres-entity-dump');

    const table = new DatabaseTable(orm.em.getPlatform(), 'test_entity', 'public');
    Object.assign(table, {
      indexes: [],
      columns: {
        name: {
          name: 'name',
          type: 'varchar(45)',
          mappedType: orm.em.getPlatform().getMappedType('varchar(45)'),
          maxLength: 45,
          nullable: true,
          default: 'null::character varying',
          indexes: [],
        },
        test: {
          name: 'test',
          type: 'varchar(50)',
          mappedType: orm.em.getPlatform().getMappedType('varchar(50)'),
          maxLength: 50,
          nullable: true,
          default: `'foo'`,
          indexes: [],
        },
      },
    });

    const helper = orm.em.getDriver().getPlatform().getSchemaHelper()!;
    const meta = table.getEntityDeclaration(orm.config.getNamingStrategy(), helper, orm.config.get('entityGenerator').scalarPropertiesForRelations!);
    expect(meta.properties.name.default).toBeNull();
    expect(meta.properties.name.defaultRaw).toBeUndefined();
    expect(meta.properties.name.nullable).toBe(true);
    expect(meta.properties.name.columnTypes[0]).toBe('varchar(45)');
    expect(meta.properties.test.default).toBe('foo');
    expect(meta.properties.test.defaultRaw).toBe(`'foo'`);
    expect(meta.properties.test.nullable).toBe(true);
    expect(meta.properties.test.columnTypes[0]).toBe('varchar(50)');

    await orm.close(true);
  });

  test('generate entities from schema with forceUndefined = false [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const dump = await orm.entityGenerator.generate({
      forceUndefined: false,
    });
    expect(dump).toMatchSnapshot('postgres-entity-dump');
    await orm.close(true);
  });

  test('generate entities from schema with forceUndefined = false and undefinedDefaults = true [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const dump = await orm.entityGenerator.generate({
      forceUndefined: false,
      undefinedDefaults: true,
    });
    expect(dump).toMatchSnapshot('postgres-entity-dump');
    await orm.close(true);
  });

  test('skipTables [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const dump = await orm.entityGenerator.generate({
      save: true,
      path: './temp/entities-pg-skipTables',
      skipTables: ['test2', 'test2_bars'],
      skipColumns: { 'public.book2': ['price'], 'public.foo_baz2': [/^nam.$/] },
    });
    expect(dump).toMatchSnapshot('postgres-entity-dump-skipTables');
    expect(existsSync('./temp/entities-pg-skipTables/Author2.ts')).toBe(true);
    expect(existsSync('./temp/entities-pg-skipTables/Test2.ts')).toBe(false);
    expect(existsSync('./temp/entities-pg-skipTables/FooBar2.ts')).toBe(true);
    await rm('./temp/entities-pg-skipTables', { recursive: true, force: true });

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('takeTables [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const dump = await orm.entityGenerator.generate({
      save: true,
      path: './temp/entities-pg-takeTables',
      takeTables: ['test2', /^foo_bar\d$/],
    });
    expect(dump).toMatchSnapshot('postgres-entity-dump-takeTables');
    expect(existsSync('./temp/entities-pg-takeTables/Author2.ts')).toBe(false);
    expect(existsSync('./temp/entities-pg-takeTables/Test2.ts')).toBe(true);
    expect(existsSync('./temp/entities-pg-takeTables/FooBar2.ts')).toBe(true);
    await rm('./temp/entities-pg-takeTables', { recursive: true, force: true });

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('takeTables and skipTables [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const dump = await orm.entityGenerator.generate({
      save: true,
      path: './temp/entities-pg',
      takeTables: ['test2', 'foo_bar2'],
      skipTables: [/^foo_bar\d$/],
    });
    expect(dump).toMatchSnapshot('postgres-entity-dump-takeTables-skipTables');
    expect(existsSync('./temp/entities-pg/Author2.ts')).toBe(false);
    expect(existsSync('./temp/entities-pg/Test2.ts')).toBe(true);
    expect(existsSync('./temp/entities-pg/FooBar2.ts')).toBe(false);
    await rm('./temp/entities-pg', { recursive: true, force: true });

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('enum with default value [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.schema.dropSchema();
    const schema = `create table "publisher2" ("id" serial primary key, "test" varchar null default '123', "type" text check ("type" in ('local', 'global')) not null default 'local', "type2" text check ("type2" in ('LOCAL', 'GLOBAL')) default 'LOCAL')`;
    await orm.schema.execute(schema);
    const dump = await orm.entityGenerator.generate({ save: false, path: './temp/entities-pg-enum' });
    expect(dump).toMatchSnapshot('postgres-entity-dump-enum-default-value');
    await orm.schema.execute(`drop table if exists "publisher2"`);
    await orm.close(true);
  });

});
