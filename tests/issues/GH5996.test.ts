import { EntitySchema, type EntitySchemaMetadata, MikroORM, type Options } from '@mikro-orm/core';
import { MikroORM as MySqlORM } from '@mikro-orm/mysql';
import { MikroORM as MariaDbORM } from '@mikro-orm/mariadb';

type Key = 'tinyint' | 'smallint' | 'mediumint';

type Property = { id: number };

const entity: Record<Key, EntitySchemaMetadata<Property>> = {
  tinyint: {
    name: 'entity',
    properties: { id: { primary: true, type: 'tinyint' } },
  },
  smallint: {
    name: 'entity',
    properties: { id: { primary: true, type: 'smallint' } },
  },
  mediumint: {
    name: 'entity',
    properties: { id: { primary: true, type: 'mediumint' } },
  },
};

let orm: MikroORM;

afterEach(async () => {
  await orm.close(true);
});

describe('MySQL supports tinyint/smallint/mediumint primary keys', () => {
  const dbInfo: Options = { dbName: 'GH5996-mysql', port: 3308 };

  test('Should be tinyint.', async () => {
    orm = await MySqlORM.init({ entities: [new EntitySchema(entity.tinyint)], ...dbInfo });
    const sql1 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(/^create table `entity` \(`id` tinyint unsigned not null auto_increment primary key\).*/);
  });

  test('Should be smallint.', async () => {
    orm = await MySqlORM.init({ entities: [new EntitySchema(entity.smallint)], ...dbInfo });
    const sql1 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(/^create table `entity` \(`id` smallint unsigned not null auto_increment primary key\).*/);
  });

  test('Should be mediumint.', async () => {
    orm = await MySqlORM.init({ entities: [new EntitySchema(entity.mediumint)], ...dbInfo });
    const sql1 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(/^create table `entity` \(`id` mediumint unsigned not null auto_increment primary key\).*/);
  });
});

describe('MariaDB supports tinyint/smallint/mediumint primary keys', () => {
  const dbInfo: Options = { dbName: 'GH5996-mariadb', port: 3309 };

  test('Should be tinyint.', async () => {
    orm = await MariaDbORM.init({ entities: [new EntitySchema(entity.tinyint)], ...dbInfo });
    const sql1 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(/^create table `entity` \(`id` tinyint unsigned not null auto_increment primary key\).*/);
  });

  test('Should be smallint.', async () => {
    orm = await MariaDbORM.init({ entities: [new EntitySchema(entity.smallint)], ...dbInfo });
    const sql1 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(/^create table `entity` \(`id` smallint unsigned not null auto_increment primary key\).*/);
  });

  test('Should be mediumint.', async () => {
    orm = await MariaDbORM.init({ entities: [new EntitySchema(entity.mediumint)], ...dbInfo });
    const sql1 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(/^create table `entity` \(`id` mediumint unsigned not null auto_increment primary key\).*/);
  });
});
