import { EntitySchema, type EntitySchemaMetadata, MikroORM, type Options } from '@mikro-orm/core';
import { MikroORM as MySqlORM } from '@mikro-orm/mysql';
import { MikroORM as MariaDbORM } from '@mikro-orm/mariadb';

type Key = 'bigint1' | 'bigint2' | 'bigint3' | 'number1' | 'number2' | 'number3';

type Property = { id: number };

const entity: Record<Key, EntitySchemaMetadata<Property>> = {
  bigint1: {
    name: 'entity',
    properties: { id: { primary: true, type: 'bigint', unsigned: false } },
  },
  bigint2: {
    name: 'entity',
    properties: { id: { primary: true, type: 'bigint', unsigned: true } },
  },
  bigint3: {
    name: 'entity',
    properties: { id: { primary: true, type: 'bigint' } },
  },

  number1: {
    name: 'entity',
    properties: { id: { primary: true, type: 'number', unsigned: false } },
  },
  number2: {
    name: 'entity',
    properties: { id: { primary: true, type: 'number', unsigned: true } },
  },
  number3: {
    name: 'entity',
    properties: { id: { primary: true, type: 'number' } },
  },
};

let orm: MikroORM;

afterEach(async () => {
  await orm.close(true);
});

describe('MySQL supports unsigned increment primary keys.', () => {
  const dbInfo: Options = { dbName: 'GH6057-mysql', port: 3308 };

  test('Should be signed bigint.', async () => {
    const signedBigintRegex = /^create table `entity` \(`id` bigint not null auto_increment primary key\).*/;

    orm = await MySqlORM.init({ entities: [new EntitySchema(entity.bigint1)], ...dbInfo });
    const sql1 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(signedBigintRegex);
  });

  test('Should be unsigned bigint.', async () => {
    const unsignedBigintRegex = /^create table `entity` \(`id` bigint unsigned not null auto_increment primary key\).*/;

    orm = await MySqlORM.init({ entities: [new EntitySchema(entity.bigint2)], ...dbInfo });
    const sql2 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql2).toMatch(unsignedBigintRegex);

    orm = await MySqlORM.init({ entities: [new EntitySchema(entity.bigint3)], ...dbInfo });
    const sql3 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql3).toMatch(unsignedBigintRegex);
  });

  test('Should be signed int.', async () => {
    const signedIntRegex = /^create table `entity` \(`id` int not null auto_increment primary key\).*/;

    orm = await MySqlORM.init({ entities: [new EntitySchema(entity.number1)], ...dbInfo });
    const sql4 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql4).toMatch(signedIntRegex);
  });

  test('Should be unsigned int.', async () => {
    const unsignedIntRegex = /^create table `entity` \(`id` int unsigned not null auto_increment primary key\).*/;

    orm = await MySqlORM.init({ entities: [new EntitySchema(entity.number2)], ...dbInfo });
    const sql5 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql5).toMatch(unsignedIntRegex);

    orm = await MySqlORM.init({ entities: [new EntitySchema(entity.number3)], ...dbInfo });
    const sql6 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql6).toMatch(unsignedIntRegex);
  });
});

describe('MariaDB supports unsigned increment primary keys.', () => {
  const dbInfo: Options = { dbName: 'GH6057-mariadb', port: 3309 };

  test('Should be signed bigint.', async () => {
    const signedBigintRegex = /^create table `entity` \(`id` bigint not null auto_increment primary key\).*/;

    orm = await MariaDbORM.init({ entities: [new EntitySchema(entity.bigint1)], ...dbInfo });
    const sql1 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(signedBigintRegex);
  });

  test('Should be unsigned bigint.', async () => {
    const unsignedBigintRegex = /^create table `entity` \(`id` bigint unsigned not null auto_increment primary key\).*/;

    orm = await MariaDbORM.init({ entities: [new EntitySchema(entity.bigint2)], ...dbInfo });
    const sql2 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql2).toMatch(unsignedBigintRegex);

    orm = await MariaDbORM.init({ entities: [new EntitySchema(entity.bigint3)], ...dbInfo });
    const sql3 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql3).toMatch(unsignedBigintRegex);
  });

  test('Should be signed int.', async () => {
    const signedIntRegex = /^create table `entity` \(`id` int not null auto_increment primary key\).*/;

    orm = await MariaDbORM.init({ entities: [new EntitySchema(entity.number1)], ...dbInfo });
    const sql4 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql4).toMatch(signedIntRegex);
  });

  test('Should be unsigned int.', async () => {
    const unsignedIntRegex = /^create table `entity` \(`id` int unsigned not null auto_increment primary key\).*/;

    orm = await MariaDbORM.init({ entities: [new EntitySchema(entity.number2)], ...dbInfo });
    const sql5 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql5).toMatch(unsignedIntRegex);

    orm = await MariaDbORM.init({ entities: [new EntitySchema(entity.number3)], ...dbInfo });
    const sql6 = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql6).toMatch(unsignedIntRegex);
  });
});
