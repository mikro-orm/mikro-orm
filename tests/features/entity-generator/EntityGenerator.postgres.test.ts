import { pathExists, remove } from 'fs-extra';
import { DatabaseTable } from '@mikro-orm/knex';
import { initORMPostgreSql } from '../../bootstrap';

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
          type: 'varchar(50)',
          maxLength: 50,
          nullable: true,
          default: 'null::character varying',
          indexes: [],
        },
        test: {
          name: 'test',
          type: 'varchar(50)',
          maxLength: 50,
          nullable: true,
          default: `'foo'`,
          indexes: [],
        },
      },
    });

    const helper = orm.em.getDriver().getPlatform().getSchemaHelper()!;
    const meta = table.getEntityDeclaration(orm.config.getNamingStrategy(), helper, orm.config.get('entityGenerator').scalarPropertiesForRelations!);
    expect(meta.properties.name.default).toBeUndefined();
    expect(meta.properties.name.defaultRaw).toBeUndefined();
    expect(meta.properties.name.nullable).toBe(true);
    expect(meta.properties.name.columnTypes[0]).toBe('varchar(50)');
    expect(meta.properties.test.default).toBe('foo');
    expect(meta.properties.test.defaultRaw).toBe(`'foo'`);
    expect(meta.properties.test.nullable).toBe(true);
    expect(meta.properties.test.columnTypes[0]).toBe('varchar(50)');

    await orm.close(true);
  });

  test('skipTables [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const dump = await orm.entityGenerator.generate({
      save: true,
      path: './temp/entities',
      skipTables: ['test2', 'test2_bars'],
      skipColumns: { 'public.book2': ['price'] },
    });
    expect(dump).toMatchSnapshot('postgres-entity-dump-skipTables');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await expect(pathExists('./temp/entities/Test2.ts')).resolves.toBe(false);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('enum with default value [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.schema.dropSchema();
    const schema = `create table "publisher2" ("id" serial primary key, "test" varchar null default '123', "type" text check ("type" in ('local', 'global')) not null default 'local', "type2" text check ("type2" in ('LOCAL', 'GLOBAL')) default 'LOCAL')`;
    await orm.schema.execute(schema);
    const dump = await orm.entityGenerator.generate({ save: false, path: './temp/entities' });
    expect(dump).toMatchSnapshot('postgres-entity-dump-enum-default-value');
    await orm.schema.execute(`drop table if exists "publisher2"`);
    await orm.close(true);
  });

});
