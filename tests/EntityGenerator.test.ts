import { pathExists, remove } from 'fs-extra';
import { MikroORM } from '@mikro-orm/core';
import { DatabaseTable } from '@mikro-orm/knex';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { initORMMySql, initORMPostgreSql, initORMSqlite } from './bootstrap';

describe('EntityGenerator', () => {

  test('generate entities from schema [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.close(true);
  });

  test('generate entities from schema [sqlite]', async () => {
    const orm = await initORMSqlite();
    const generator = new EntityGenerator(orm.em);
    const dump = await generator.generate({ save: true });
    expect(dump).toMatchSnapshot('sqlite-entity-dump');
    await expect(pathExists('./tests/generated-entities/Author3.ts')).resolves.toBe(true);
    await remove('./tests/generated-entities');

    await orm.close(true);
  });

  test('generate entities from schema [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const generator = new EntityGenerator(orm.em);
    const dump = await generator.generate();
    expect(dump).toMatchSnapshot('postgres-entity-dump');

    const table = new DatabaseTable('test_entity', 'public');
    Object.assign(table, {
      indexes: [],
      columns: {
        name: {
          name: 'name',
          type: 'varchar(50)',
          maxLength: 50,
          nullable: true,
          defaultValue: 'null::character varying',
          indexes: [],
        },
        test: {
          name: 'test',
          type: 'varchar(50)',
          maxLength: 50,
          nullable: true,
          defaultValue: 'foo',
          indexes: [],
        },
      },
    });

    const helper = orm.em.getDriver().getPlatform().getSchemaHelper()!;
    const meta = table.getEntityDeclaration(orm.config.getNamingStrategy(), helper);
    expect(meta.properties.name.default).toBeUndefined();
    expect(meta.properties.name.nullable).toBe(true);
    expect(meta.properties.name.columnTypes[0]).toBe('varchar(50)');
    expect(meta.properties.test.default).toBe('foo');
    expect(meta.properties.test.nullable).toBe(true);
    expect(meta.properties.test.columnTypes[0]).toBe('varchar(50)');

    await orm.close(true);
  });

  test('not supported [mongodb]', async () => {
    const orm = await MikroORM.init({ type: 'mongo', dbName: 'mikro-orm-test', discovery: { warnWhenNoEntities: false } }, false);
    expect(() => orm.getEntityGenerator()).toThrowError('MongoPlatform does not support EntityGenerator');
  });

});
