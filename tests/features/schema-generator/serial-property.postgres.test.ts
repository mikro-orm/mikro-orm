import { Entity,  MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({ tableName: 'something' })
export class Something0 {

  @PrimaryKey()
  id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
export class Something1 {

  @PrimaryKey()
  id!: number;

  @Property({ autoincrement: true })
  _id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
export class Something2 {

  @PrimaryKey()
  id!: number;

  @Property()
  _id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
export class Something3 {

  @PrimaryKey()
  id!: number;

  @Property({ autoincrement: true })
  _id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
export class Something4 {

  @PrimaryKey()
  id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
export class Something5 {

  @PrimaryKey({ primary: true })
  id!: string;

  @Property({ autoincrement: true })
  _id!: number;

  @Property()
  foo!: string;

}

test('schema generator works with non-pk autoincrement columns (serial)', async () => {
  const orm = await MikroORM.init({
    entities: [Something0],
    dbName: `mikro_orm_test_serial`,
    driver: PostgreSqlDriver,
    schemaGenerator: { disableForeignKeys: false },
  });

  const mock = mockLogger(orm, ['schema']);

  const generator = orm.schema;
  await generator.refreshDatabase();
  await expect(generator.getUpdateSchemaSQL()).resolves.toBe('');

  orm.getMetadata().reset('Something0');
  await orm.discoverEntity(Something1);
  const diff1 = await generator.getUpdateSchemaSQL();
  expect(diff1).toMatchSnapshot();
  await generator.execute(diff1);

  await expect(generator.getUpdateSchemaSQL()).resolves.toBe('');

  orm.getMetadata().reset('Something1');
  await orm.discoverEntity(Something2);
  const diff2 = await generator.getUpdateSchemaSQL();
  expect(diff2).toMatchSnapshot();
  await generator.execute(diff2);

  await expect(generator.getUpdateSchemaSQL()).resolves.toBe('');

  orm.getMetadata().reset('Something2');
  await orm.discoverEntity(Something3);
  const diff3 = await generator.getUpdateSchemaSQL();
  expect(diff3).toMatchSnapshot();
  await generator.execute(diff3);

  await expect(generator.getUpdateSchemaSQL()).resolves.toBe('');

  orm.getMetadata().reset('Something3');
  await orm.discoverEntity(Something4);
  const diff4 = await generator.getUpdateSchemaSQL();
  expect(diff4).toMatchSnapshot();
  await generator.execute(diff4);

  await expect(generator.getUpdateSchemaSQL()).resolves.toBe('');

  orm.getMetadata().reset('Something4');
  await orm.discoverEntity(Something5);
  const diff5 = await generator.getUpdateSchemaSQL();
  expect(diff5).toMatchSnapshot();
  await generator.execute(diff5);

  await expect(generator.getUpdateSchemaSQL()).resolves.toBe('');

  const diff52 = await generator.getCreateSchemaSQL();
  await expect(diff52).toMatchSnapshot();

  await orm.close(true);

  expect(mock.mock.calls).toHaveLength(10);
  expect(mock.mock.calls[0][0]).toMatch(`column public.something._id of type serial added`);
  expect(mock.mock.calls[1][0]).toMatch(`'autoincrement' changed for column public.something._id { column1: { name: '_id', type: 'int4', mappedType: IntegerType {}, length: null, precision: 32, scale: 0, nullable: false, default: null, unsigned: true, autoincrement: true, comment: null, primary: false, unique: false, enumItems: [] }, column2: { name: '_id', type: 'int', mappedType: IntegerType {}, unsigned: false, autoincrement: false, primary: false, nullable: false }}`);
  expect(mock.mock.calls[2][0]).toMatch(`column public.something._id changed { changedProperties: Set(1) { 'autoincrement' } }`);
  expect(mock.mock.calls[3][0]).toMatch(`'autoincrement' changed for column public.something._id { column1: { name: '_id', type: 'int4', mappedType: IntegerType {}, length: null, precision: 32, scale: 0, nullable: false, default: null, comment: null, primary: false, unique: false, enumItems: [] }, column2: { name: '_id', type: 'serial', mappedType: IntegerType {}, unsigned: true, autoincrement: true, primary: false, nullable: false }}`);
  expect(mock.mock.calls[4][0]).toMatch(`column public.something._id changed { changedProperties: Set(1) { 'autoincrement' } }`);
  expect(mock.mock.calls[5][0]).toMatch(`column public.something._id removed`);
  expect(mock.mock.calls[6][0]).toMatch(`column public.something._id of type serial added`);
  expect(mock.mock.calls[7][0]).toMatch(`'type' changed for column public.something.id { columnType1: 'int', columnType2: 'varchar(255)' }`);
  expect(mock.mock.calls[8][0]).toMatch(`'autoincrement' changed for column public.something.id { column1: { name: 'id', type: 'int4', mappedType: IntegerType {}, length: null, precision: 32, scale: 0, nullable: false, default: null, unsigned: true, autoincrement: true, comment: null, primary: true, unique: false, enumItems: [] }, column2: { name: 'id', type: 'varchar(255)', mappedType: StringType {}, unsigned: false, autoincrement: false, primary: false, nullable: false }}`);
  expect(mock.mock.calls[9][0]).toMatch(`column public.something.id changed { changedProperties: Set(2) { 'type', 'autoincrement' } }`);
});

test('create schema dump with serial property', async () => {
  const orm = await MikroORM.init({
    entities: [Something1],
    dbName: `mikro_orm_test_serial`,
    driver: PostgreSqlDriver,
    schemaGenerator: { disableForeignKeys: false },
    debug: ['schema'],
  });

  await orm.schema.refreshDatabase();
  const create = await orm.schema.getCreateSchemaSQL();
  expect(create).toMatch('create table "something" ("id" serial primary key, "_id" serial, "foo" varchar(255) not null);');
  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toBe('');

  await orm.close(true);
});
