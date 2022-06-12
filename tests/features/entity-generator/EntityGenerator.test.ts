import { pathExists, remove } from 'fs-extra';
import { MikroORM } from '@mikro-orm/core';
import { DatabaseTable } from '@mikro-orm/knex';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { initORMMySql, initORMPostgreSql, initORMSqlite } from '../../bootstrap';

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

  test('generate entities with bidirectional relations [mysql]', async () => {
    const orm = await initORMMySql('mysql', { entityGenerator: { bidirectionalRelations: true } }, true);
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-bidirectional-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.close(true);
  });

  test('generate entities with bidirectional relations and reference wrappers [mysql]', async () => {
    const orm = await initORMMySql('mysql', {
      entityGenerator: {
        bidirectionalRelations: true,
        identifiedReferences: true,
      },
    }, true);
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-bidirectional-dump');
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
          default: 'foo',
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

  test('table name starting with number [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().execute(`
      create table if not exists \`123_table_name\` (\`id\` int(10) unsigned not null auto_increment primary key) default character set utf8mb4 engine = InnoDB;
    `);
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-dump-number');
    await orm.getSchemaGenerator().execute(`
      drop table if exists \`123_table_name\`;
    `);
    await orm.close(true);
  });

  test('enum with default value [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    await orm.getSchemaGenerator().dropSchema();
    const schema = "create table `publisher2` (`id` int(10) unsigned not null auto_increment primary key, `test` varchar(100) null default '123', `type` enum('local', 'global') not null default 'local', `type2` enum('LOCAL', 'GLOBAL') default 'LOCAL') default character set utf8mb4 engine = InnoDB;";
    await orm.getSchemaGenerator().execute(schema);
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-dump-enum-default-value');
    await orm.getSchemaGenerator().execute('drop table if exists `publisher2`');
    await orm.close(true);
  });

  test('enum with default value [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.getSchemaGenerator().dropSchema();
    const schema = `create table "publisher2" ("id" serial primary key, "test" varchar null default '123', "type" text check ("type" in ('local', 'global')) not null default 'local', "type2" text check ("type2" in ('LOCAL', 'GLOBAL')) default 'LOCAL')`;
    await orm.getSchemaGenerator().execute(schema);
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('postgres-entity-dump-enum-default-value');
    await orm.getSchemaGenerator().execute(`drop table if exists "publisher2"`);
    await orm.close(true);
  });

});
