import type { EntitySchemaMetadata } from '@mikro-orm/core';
import { MikroORM as MySqlORM, EntitySchema as MySqlSchema } from '@mikro-orm/mysql';
import { MikroORM as SqliteORM, EntitySchema as SqliteSchema } from '@mikro-orm/sqlite';
import { MikroORM as PostgreSqlORM, EntitySchema as PostgreSqlSchema } from '@mikro-orm/postgresql';

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

describe('MySql support unsigned increment pk.', () => {
  const dbInfo = { dbName: 'GH6057', port: 3308 };

  test('Should be non-unsigned bigint.', async () => {
    const nonUnsignedBigintRegex = /^create table `entity` \(`id` bigint not null auto_increment primary key\).*/;

    const orm1 = await MySqlORM.init({ entities: [new MySqlSchema(entity.bigint1)], ...dbInfo });
    const sql1 = await orm1.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(nonUnsignedBigintRegex);
    await orm1.close();
  });

  test('Should be unsigned bigint.', async () => {
    const unsignedBigintRegex = /^create table `entity` \(`id` bigint unsigned not null auto_increment primary key\).*/;

    const orm2 = await MySqlORM.init({ entities: [new MySqlSchema(entity.bigint2)], ...dbInfo });
    const sql2 = await orm2.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql2).toMatch(unsignedBigintRegex);
    await orm2.close();

    const orm3 = await MySqlORM.init({ entities: [new MySqlSchema(entity.bigint3)], ...dbInfo });
    const sql3 = await orm3.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql3).toMatch(unsignedBigintRegex);
    await orm3.close();
  });

  test('Should be non-unsigned int.', async () => {
    const nonUnsignedIntRegex = /^create table `entity` \(`id` int not null auto_increment primary key\).*/;

    const orm4 = await MySqlORM.init({ entities: [new MySqlSchema(entity.number1)], ...dbInfo });
    const sql4 = await orm4.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql4).toMatch(nonUnsignedIntRegex);
    await orm4.close();
  });

  test('Should be unsigned int.', async () => {
    const unsignedIntRegex = /^create table `entity` \(`id` int unsigned not null auto_increment primary key\).*/;

    const orm5 = await MySqlORM.init({ entities: [new MySqlSchema(entity.number2)], ...dbInfo });
    const sql5 = await orm5.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql5).toMatch(unsignedIntRegex);
    await orm5.close();

    const orm6 = await MySqlORM.init({ entities: [new MySqlSchema(entity.number3)], ...dbInfo });
    const sql6 = await orm6.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql6).toMatch(unsignedIntRegex);
    await orm6.close();
  });
});

describe('Sqlite not support unsigned increment pk.', () => {
  const dbInfo = { dbName: ':memory:' };

  test('Should be non-unsigned integer.', async () => {
    const nonUnsignedIntegerRegex = /^create table `entity` \(`id` integer not null primary key autoincrement\).*/;

    const orm1 = await SqliteORM.init({ entities: [new SqliteSchema(entity.bigint1)], ...dbInfo });
    const sql1 = await orm1.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1).toMatch(nonUnsignedIntegerRegex);
    await orm1.close();

    const orm2 = await SqliteORM.init({ entities: [new SqliteSchema(entity.bigint2)], ...dbInfo });
    const sql2 = await orm2.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql2).toMatch(nonUnsignedIntegerRegex);
    await orm2.close();

    const orm3 = await SqliteORM.init({ entities: [new SqliteSchema(entity.bigint3)], ...dbInfo });
    const sql3 = await orm3.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql3).toMatch(nonUnsignedIntegerRegex);
    await orm3.close();

    const orm4 = await SqliteORM.init({ entities: [new SqliteSchema(entity.number1)], ...dbInfo });
    const sql4 = await orm4.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql4).toMatch(nonUnsignedIntegerRegex);
    await orm4.close();

    const orm5 = await SqliteORM.init({ entities: [new SqliteSchema(entity.number2)], ...dbInfo });
    const sql5 = await orm5.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql5).toMatch(nonUnsignedIntegerRegex);
    await orm5.close();

    const orm6 = await SqliteORM.init({ entities: [new SqliteSchema(entity.number3)], ...dbInfo });
    const sql6 = await orm6.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql6).toMatch(nonUnsignedIntegerRegex);
    await orm6.close();
  });
});

describe('PostgreSql not support unsigned increment pk.', () => {
  const dbInfo = { dbName: 'GH6057' };

  test('Should be non-unsigned bigserial.', async () => {
    const nonUnsignedBigserialRegex = /^create table "entity" \("id" bigserial primary key\);.*/;

    const orm1 = await PostgreSqlORM.init({ entities: [new PostgreSqlSchema(entity.bigint1)], ...dbInfo });
    const sql1 = await orm1.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql1.trim()).toMatch(nonUnsignedBigserialRegex);
    await orm1.close();

    const orm2 = await PostgreSqlORM.init({ entities: [new PostgreSqlSchema(entity.bigint2)], ...dbInfo });
    const sql2 = await orm2.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql2.trim()).toMatch(nonUnsignedBigserialRegex);
    await orm2.close();

    const orm3 = await PostgreSqlORM.init({ entities: [new PostgreSqlSchema(entity.bigint3)], ...dbInfo });
    const sql3 = await orm3.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql3.trim()).toMatch(nonUnsignedBigserialRegex);
    await orm3.close();
  });

  test('Should be non-unsigned serial.', async () => {
    const nonUnsignedSerialRegex = /^create table "entity" \("id" serial primary key\);.*/;

    const orm4 = await PostgreSqlORM.init({ entities: [new PostgreSqlSchema(entity.number1)], ...dbInfo });
    const sql4 = await orm4.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql4.trim()).toMatch(nonUnsignedSerialRegex);
    await orm4.close();

    const orm5 = await PostgreSqlORM.init({ entities: [new PostgreSqlSchema(entity.number2)], ...dbInfo });
    const sql5 = await orm5.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql5.trim()).toMatch(nonUnsignedSerialRegex);
    await orm5.close();

    const orm6 = await PostgreSqlORM.init({ entities: [new PostgreSqlSchema(entity.number3)], ...dbInfo });
    const sql6 = await orm6.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql6.trim()).toMatch(nonUnsignedSerialRegex);
    await orm6.close();
  });
});
