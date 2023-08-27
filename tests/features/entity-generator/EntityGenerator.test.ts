import { pathExists, remove } from 'fs-extra';
import { MikroORM } from '@mikro-orm/core';
import { DatabaseTable } from '@mikro-orm/knex';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MongoDriver } from '@mikro-orm/mongodb';
import { initORMMySql, initORMPostgreSql, initORMSqlite } from '../../bootstrap';

describe('EntityGenerator', () => {

  test('generate entities from schema [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const dump = await orm.entityGenerator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('skipTables [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const dump = await orm.entityGenerator.generate({
      save: true,
      baseDir: './temp/entities',
      skipTables: ['test2', 'test2_bars'],
      skipColumns: { book2: ['price'] },
    });
    expect(dump).toMatchSnapshot('mysql-entity-dump-skipTables');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate entities with bidirectional relations [mysql]', async () => {
    const orm = await initORMMySql('mysql', { entityGenerator: { bidirectionalRelations: true } }, true);
    const dump = await orm.entityGenerator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-bidirectional-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate entities with bidirectional relations and reference wrappers [mysql]', async () => {
    const orm = await initORMMySql('mysql', {
      entityGenerator: {
        bidirectionalRelations: true,
        identifiedReferences: true,
      },
    }, true);
    const dump = await orm.entityGenerator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-bidirectional-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate EntitySchema with bidirectional relations and reference wrappers [mysql]', async () => {
    const orm = await initORMMySql('mysql', {
      entityGenerator: {
        bidirectionalRelations: true,
        identifiedReferences: true,
        entitySchema: true,
      },
    }, true);
    const dump = await orm.entityGenerator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-schema-bidirectional-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await orm.schema.dropDatabase();
    await orm.close(true);

    // try to discover the entities to verify they are valid
    const orm2 = await MikroORM.init({
      driver: SqliteDriver,
      entities: ['./temp/entities'],
      dbName: ':memory:',
    });
    await orm2.close(true);
    await remove('./temp/entities');
  });

  test('generate entities with reference wrappers and named import [mysql]', async () => {
    const orm = await initORMMySql('mysql', {
      entityGenerator: {
        identifiedReferences: true,
        esmImport: true,
      },
    }, true);
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-named-dump');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate entities from schema [sqlite]', async () => {
    const orm = await initORMSqlite();
    const dump = await orm.entityGenerator.generate({ save: true });
    expect(dump).toMatchSnapshot('sqlite-entity-dump');
    await expect(pathExists('./tests/generated-entities/Author3.ts')).resolves.toBe(true);
    await remove('./tests/generated-entities');

    await orm.close(true);
  });

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

  test('skipTables [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const dump = await orm.entityGenerator.generate({
      save: true,
      baseDir: './temp/entities',
      skipTables: ['test2', 'test2_bars'],
      skipColumns: { 'public.book2': ['price'] },
    });
    expect(dump).toMatchSnapshot('postgres-entity-dump-skipTables');
    await expect(pathExists('./temp/entities/Author2.ts')).resolves.toBe(true);
    await remove('./temp/entities');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('not supported [mongodb]', async () => {
    const orm = await MikroORM.init({ driver: MongoDriver, dbName: 'mikro-orm-test', discovery: { warnWhenNoEntities: false } }, false);
    expect(() => orm.entityGenerator).toThrowError('MongoPlatform does not support EntityGenerator');
  });

  test('table name starting with number [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    await orm.schema.dropSchema();
    await orm.schema.execute(`
      create table if not exists \`123_table_name\` (\`id\` int(10) unsigned not null auto_increment primary key) default character set utf8mb4 engine = InnoDB;
    `);
    const dump = await orm.entityGenerator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-dump-number');
    await orm.schema.execute(`
      drop table if exists \`123_table_name\`;
    `);
    await orm.close(true);
  });

  test('table name with underscore using entitySchema [mysql]', async () => {
    const orm = await initORMMySql('mysql', {
      entityGenerator: {
        entitySchema: true,
        identifiedReferences: true,
      },
    }, true);
    await orm.schema.dropSchema();
    await orm.schema.execute(`
      create table if not exists \`123_table_name\` (\`id\` int(10) unsigned not null auto_increment primary key) default character set utf8mb4 engine = InnoDB;
    `);
    const dump = await orm.entityGenerator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-dump-underscore-entity-schema');
    await orm.schema.execute(`
      drop table if exists \`123_table_name\`;
    `);
    await orm.close(true);
  });

  test('numeric nullable columns with null default [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    await orm.schema.dropSchema();
    await orm.schema.execute(`
      CREATE TABLE if not exists \`vrf\` (  \`id\` int(11) NOT NULL AUTO_INCREMENT,  \`vrf_id\` int(11) DEFAULT NULL,  \`comments\` varchar(150) DEFAULT NULL,  \`created_at\` timestamp NULL DEFAULT current_timestamp(),  \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),  PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    const dump = await orm.entityGenerator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-gh-3285');
    await orm.schema.execute(`
      drop table if exists \`vrf\`;
    `);
    await orm.close(true);
  });

  test('numeric nullable columns with null default [mariadb]', async () => {
    const orm = await initORMMySql('mariadb', {}, true);
    await orm.schema.dropSchema();
    await orm.schema.execute(`
      CREATE TABLE if not exists \`vrf\` (  \`id\` int(11) NOT NULL AUTO_INCREMENT,  \`vrf_id\` int(11) DEFAULT NULL,  \`comments\` varchar(150) DEFAULT NULL,  \`created_at\` timestamp NULL DEFAULT current_timestamp(),  \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),  PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    const dump = await orm.entityGenerator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mariadb-entity-gh-3285');
    await orm.schema.execute(`
      drop table if exists \`vrf\`;
    `);
    await orm.close(true);
  });

  test('enum with default value [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    await orm.schema.dropSchema();
    const schema = "create table `publisher2` (`id` int(10) unsigned not null auto_increment primary key, `test` varchar(100) null default '123', `type` enum('local', 'global') not null default 'local', `type2` enum('LOCAL', 'GLOBAL') default 'LOCAL') default character set utf8mb4 engine = InnoDB;";
    await orm.schema.execute(schema);
    const dump = await orm.entityGenerator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('mysql-entity-dump-enum-default-value');
    await orm.schema.execute('drop table if exists `publisher2`');
    await orm.close(true);
  });

  test('enum with default value [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.schema.dropSchema();
    const schema = `create table "publisher2" ("id" serial primary key, "test" varchar null default '123', "type" text check ("type" in ('local', 'global')) not null default 'local', "type2" text check ("type2" in ('LOCAL', 'GLOBAL')) default 'LOCAL')`;
    await orm.schema.execute(schema);
    const dump = await orm.entityGenerator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('postgres-entity-dump-enum-default-value');
    await orm.schema.execute(`drop table if exists "publisher2"`);
    await orm.close(true);
  });

  test('generate OptionalProps and include properties for columns that are not nullable, but have defaults', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    await orm.schema.dropSchema();
    const schema = "create table if not exists `account` (`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, `active` tinyint(1) NOT NULL DEFAULT '0', `receive_email_notifications` tinyint(1) NOT NULL DEFAULT '1', PRIMARY KEY (`id`)) default character set utf8mb4 engine = InnoDB;";
    await orm.schema.execute(schema);
    const dump = await orm.entityGenerator.generate({ save: false, baseDir: './temp/entities' });
    expect(dump).toMatchSnapshot('generate-OptionalProps');
    await orm.schema.execute('drop table if exists `account`');
    await orm.close(true);
  });
});
