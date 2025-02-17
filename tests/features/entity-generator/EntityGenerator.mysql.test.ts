import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { initORMMySql } from '../../bootstrap.js';

describe('EntityGenerator', () => {

  test('generate entities from schema [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const dump = await orm.entityGenerator.generate({ save: true, path: './temp/entities-mysql' });
    expect(dump).toMatchSnapshot('mysql-entity-dump');

    expect(existsSync('./temp/entities-mysql/Author2.ts')).toBe(true);
    await rm('./temp/entities-mysql', { recursive: true, force: true });

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate entities from schema with forceUndefined = false [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const dump = await orm.entityGenerator.generate({
      forceUndefined: false,
    });
    expect(dump).toMatchSnapshot('mysql-entity-dump');
    await orm.close(true);
  });

  test('generate entities from schema with forceUndefined = false and undefinedDefaults = true [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const dump = await orm.entityGenerator.generate({
      forceUndefined: false,
      undefinedDefaults: true,
    });
    expect(dump).toMatchSnapshot('mysql-entity-dump');
    await orm.close(true);
  });

  test('skipTables [mysql]', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const dump = await orm.entityGenerator.generate({
      save: true,
      path: './temp/entities-mysql-skip',
      skipTables: ['test2', 'test2_bars'],
      skipColumns: { book2: ['price'] },
    });
    expect(dump).toMatchSnapshot('mysql-entity-dump-skipTables');
    expect(existsSync('./temp/entities-mysql-skip/Author2.ts')).toBe(true);
    await rm('./temp/entities-mysql-skip', { recursive: true, force: true });

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate entities with bidirectional relations [mysql]', async () => {
    const orm = await initORMMySql('mysql', { entityGenerator: { bidirectionalRelations: true } }, true);
    const dump = await orm.entityGenerator.generate({ save: true, path: './temp/entities-mysql-bidirectional' });
    expect(dump).toMatchSnapshot('mysql-entity-bidirectional-dump');
    expect(existsSync('./temp/entities-mysql-bidirectional/Author2.ts')).toBe(true);
    await rm('./temp/entities-mysql-bidirectional', { recursive: true, force: true });

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
    const dump = await orm.entityGenerator.generate({ save: true, path: './temp/entities-mysql-bidirectional-ref' });
    expect(dump).toMatchSnapshot('mysql-entity-bidirectional-dump');
    expect(existsSync('./temp/entities-mysql-bidirectional-ref/Author2.ts')).toBe(true);
    await rm('./temp/entities-mysql-bidirectional-ref', { recursive: true, force: true });

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
    const dump = await orm.entityGenerator.generate({ save: true, path: './temp/entities-mysql-bidirectional-ref-es' });
    expect(dump).toMatchSnapshot('mysql-entity-schema-bidirectional-dump');
    expect(existsSync('./temp/entities-mysql-bidirectional-ref-es/Author2.ts')).toBe(true);
    await orm.schema.dropDatabase();
    await orm.close(true);

    // try to discover the entities to verify they are valid
    const orm2 = await MikroORM.init({
      driver: SqliteDriver,
      entities: ['./temp/entities-mysql-bidirectional-ref-es'],
      dbName: ':memory:',
    });
    await orm2.close(true);
    await rm('./temp/entities-mysql-bidirectional-ref-es', { recursive: true, force: true });
  });

  test('generate entities with reference wrappers and named import [mysql]', async () => {
    const orm = await initORMMySql('mysql', {
      entityGenerator: {
        identifiedReferences: true,
        esmImport: true,
      },
    }, true);
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, path: './temp/entities-mysql-ref-esm' });
    expect(dump).toMatchSnapshot('mysql-entity-named-dump');
    expect(existsSync('./temp/entities-mysql-ref-esm/Author2.ts')).toBe(true);
    await rm('./temp/entities-mysql-ref-esm', { recursive: true, force: true });

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('generate EntitySchema with reference wrappers and named import [mysql]', async () => {
    const orm = await initORMMySql('mysql', {
      entityGenerator: {
        entitySchema: true,
        identifiedReferences: true,
        esmImport: true,
      },
    }, true);
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: true, path: './temp/entities-mysql-ref-esm-es' });
    expect(dump).toMatchSnapshot('mysql-entityschema-named-dump');
    expect(existsSync('./temp/entities-mysql-ref-esm-es/Author2.ts')).toBe(true);
    await rm('./temp/entities-mysql-ref-esm-es', { recursive: true, force: true });

    await orm.schema.dropDatabase();
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
    const dump = await orm.entityGenerator.generate({ save: false, path: './temp/entities-mysql' });
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
    const dump = await orm.entityGenerator.generate({ save: false, path: './temp/entities-mysql' });
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
    const dump = await orm.entityGenerator.generate({ save: false, path: './temp/entities-mysql' });
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
    const dump = await orm.entityGenerator.generate({ save: false, path: './temp/entities-mysql' });
    expect(dump).toMatchSnapshot('mysql-entity-dump-enum-default-value');
    await orm.schema.execute('drop table if exists `publisher2`');
    await orm.close(true);
  });

  test('generate OptionalProps and include properties for columns that are not nullable, but have defaults', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    await orm.schema.dropSchema();
    const schema = "create table if not exists `account` (`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, `active` tinyint(1) NOT NULL DEFAULT '0', `receive_email_notifications` tinyint(1) NOT NULL DEFAULT '1', PRIMARY KEY (`id`)) default character set utf8mb4 engine = InnoDB;";
    await orm.schema.execute(schema);
    const dump = await orm.entityGenerator.generate({ save: false, path: './temp/entities-mysql' });
    expect(dump).toMatchSnapshot('generate-OptionalProps');
    await orm.schema.execute('drop table if exists `account`');
    await orm.close(true);
  });

});
