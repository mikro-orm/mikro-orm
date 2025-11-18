import 'reflect-metadata';
import { rm } from 'node:fs/promises';
import { MikroORM } from '@mikro-orm/mysql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { initORMMySql } from '../../bootstrap.js';
import { EntityGenerator } from '@mikro-orm/entity-generator';

describe.each(['ts-enum', 'union-type', 'dictionary'] as const)('EntityGenerator (enumMode=%s) [mysql]', enumMode => {
  describe.each(['entitySchema', 'defineEntity', 'defineEntity+types', 'decorators'] as const)('%s', entityDefinition => {
    let orm: MikroORM;

    beforeAll(async () => {
      orm = await initORMMySql('mysql', {
        dbName: 'entity-generator-tests',
        serialization: { forceObject: true },
        entityGenerator: {
          enumMode,
          entityDefinition: entityDefinition === 'defineEntity+types' ? 'defineEntity' : entityDefinition,
          inferEntityType: entityDefinition === 'defineEntity+types',
          identifiedReferences: true,
          bidirectionalRelations: true,
        },
      }, true);
    });

    afterAll(() => orm.close(true));

    test('generate entities from schema', async () => {
      const path = `./tests/temp/entities-${entityDefinition}-${enumMode}-mysql`;
      const dump = await orm.entityGenerator.generate({
        save: true,
        path,
      });
      expect(dump).toMatchSnapshot(`mysql-${entityDefinition}-${enumMode}-dump`);

      // try to discover the entities to verify they are valid
      await MikroORM.init({
        driver: SqliteDriver,
        entities: [path],
        dbName: ':memory:',
        });
      await rm(path, { recursive: true, force: true });
    });

    test('generate entities from schema with forceUndefined = false', async () => {
      const dump = await orm.entityGenerator.generate({
        forceUndefined: false,
      });
      expect(dump).toMatchSnapshot(`mysql-${entityDefinition}-${enumMode}-dump`);
    });

    test('generate entities from schema with forceUndefined = false and undefinedDefaults = true', async () => {
      const dump = await orm.entityGenerator.generate({
        forceUndefined: false,
        undefinedDefaults: true,
      });
      expect(dump).toMatchSnapshot(`mysql-${entityDefinition}-${enumMode}-dump`);
    });
  });
});

test('table name with underscore using entitySchema [mysql]', async () => {
  const orm = await MikroORM.init({
    dbName: '3285',
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
  });
  await orm.schema.execute(`
      create table if not exists \`123_table_name\` (\`id\` int(10) unsigned not null auto_increment primary key) default character set utf8mb4 engine = InnoDB;
    `);
  const dump = await orm.entityGenerator.generate({
    entityDefinition: 'entitySchema',
    identifiedReferences: true,
    save: false,
    path: './temp/entities-mysql',
  });
  expect(dump).toMatchSnapshot('mysql-entity-dump-underscore-entity-schema');
  await orm.schema.execute('drop table if exists `123_table_name`');
  await orm.close();
});

test('numeric nullable columns with null default [mysql]', async () => {
  const orm = await MikroORM.init({
    dbName: '3285',
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
  });
  await orm.schema.execute(`
      CREATE TABLE if not exists \`vrf\` (  \`id\` int(11) NOT NULL AUTO_INCREMENT,  \`vrf_id\` int(11) DEFAULT NULL,  \`comments\` varchar(150) DEFAULT NULL,  \`created_at\` timestamp NULL DEFAULT current_timestamp(),  \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),  PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot('mysql-entity-gh-3285');
  await orm.schema.execute('drop table if exists `vrf`');
  await orm.close();
});

test('numeric nullable columns with null default [mariadb]', async () => {
  const orm = await MikroORM.init({
    driver: MariaDbDriver,
    dbName: '3285',
    port: 3309,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
  });
  await orm.schema.execute(`
      CREATE TABLE if not exists \`vrf\` (  \`id\` int(11) NOT NULL AUTO_INCREMENT,  \`vrf_id\` int(11) DEFAULT NULL,  \`comments\` varchar(150) DEFAULT NULL,  \`created_at\` timestamp NULL DEFAULT current_timestamp(),  \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),  PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot('mariadb-entity-gh-3285');
  await orm.schema.execute('drop table if exists `vrf`');
  await orm.close();
});

test('enum with default value [mysql]', async () => {
  const orm = await MikroORM.init({
    dbName: '3285',
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
  });
  const schema = "create table if not exists `publisher2` (`id` int(10) unsigned not null auto_increment primary key, `test` varchar(100) null default '123', `type` enum('local', 'global') not null default 'local', `type2` enum('LOCAL', 'GLOBAL') default 'LOCAL') default character set utf8mb4 engine = InnoDB;";
  await orm.schema.execute(schema);
  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot('mysql-entity-dump-enum-default-value');
  await orm.schema.execute('drop table if exists `publisher2`');
  await orm.close();
});

test('generate OptionalProps and include properties for columns that are not nullable, but have defaults', async () => {
  const orm = await MikroORM.init({
    dbName: '3285',
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
  });
  const schema = "create table if not exists `account` (`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, `active` tinyint(1) NOT NULL DEFAULT '0', `receive_email_notifications` tinyint(1) NOT NULL DEFAULT '1', PRIMARY KEY (`id`)) default character set utf8mb4 engine = InnoDB;";
  await orm.schema.execute(schema);
  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot('generate-OptionalProps');
  await orm.schema.execute('drop table if exists `account`');
  await orm.close();
});
