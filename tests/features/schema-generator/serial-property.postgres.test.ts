import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

@Entity({ tableName: 'something' })
class Something0 {

  @PrimaryKey()
  id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
class Something1 {

  @PrimaryKey()
  id!: number;

  @Property({ autoincrement: true })
  _id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
class Something2 {

  @PrimaryKey()
  id!: number;

  @Property()
  _id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
class Something3 {

  @PrimaryKey()
  id!: number;

  @Property({ autoincrement: true })
  _id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
class Something4 {

  @PrimaryKey()
  id!: number;

  @Property()
  foo!: string;

}

@Entity({ tableName: 'something' })
class Something5 {

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
    schemaGenerator: { disableForeignKeys: false },
  });

  const mock = mockLogger(orm, ['schema']);

  await orm.schema.refreshDatabase();
  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

  orm.discoverEntity(Something1, 'Something0');
  const diff1 = await orm.schema.getUpdateSchemaSQL();
  expect(diff1).toMatchSnapshot();
  await orm.schema.execute(diff1);

  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

  orm.discoverEntity(Something2, 'Something1');
  const diff2 = await orm.schema.getUpdateSchemaSQL();
  expect(diff2).toMatchSnapshot();
  await orm.schema.execute(diff2);

  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

  orm.discoverEntity(Something3, 'Something2');
  const diff3 = await orm.schema.getUpdateSchemaSQL();
  expect(diff3).toMatchSnapshot();
  await orm.schema.execute(diff3);

  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

  orm.discoverEntity(Something4, 'Something3');
  const diff4 = await orm.schema.getUpdateSchemaSQL();
  expect(diff4).toMatchSnapshot();
  await orm.schema.execute(diff4);

  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

  orm.discoverEntity(Something5, 'Something4');
  const diff5 = await orm.schema.getUpdateSchemaSQL();
  expect(diff5).toMatchSnapshot();
  await orm.schema.execute(diff5);

  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

  const diff52 = await orm.schema.getCreateSchemaSQL();
  expect(diff52).toMatchSnapshot();

  await orm.close(true);

  expect(mock.mock.calls).toHaveLength(10);
  expect(mock.mock.calls[0][0]).toMatch(`column something._id of type serial added`);
  expect(mock.mock.calls[1][0]).toMatch(`'autoincrement' changed for column something._id { fromColumn: { name: '_id', type: 'int4', mappedType: IntegerType {}, length: null, precision: 32, scale: 0, nullable: false, default: null, unsigned: true, autoincrement: true, comment: null, primary: false, unique: false, enumItems: [] }, toColumn: { name: '_id', type: 'int', mappedType: IntegerType {}, unsigned: false, autoincrement: false, primary: false, nullable: false }}`);
  expect(mock.mock.calls[2][0]).toMatch(`column something._id changed { changedProperties: Set(1) { 'autoincrement' } }`);
  expect(mock.mock.calls[3][0]).toMatch(`'autoincrement' changed for column something._id { fromColumn: { name: '_id', type: 'int4', mappedType: IntegerType {}, length: null, precision: 32, scale: 0, nullable: false, default: null, unsigned: false, autoincrement: false, comment: null, primary: false, unique: false, enumItems: [] }, toColumn: { name: '_id', type: 'serial', mappedType: IntegerType {}, unsigned: true, autoincrement: true, primary: false, nullable: false }}`);
  expect(mock.mock.calls[4][0]).toMatch(`column something._id changed { changedProperties: Set(1) { 'autoincrement' } }`);
  expect(mock.mock.calls[5][0]).toMatch(`column something._id removed`);
  expect(mock.mock.calls[6][0]).toMatch(`column something._id of type serial added`);
  expect(mock.mock.calls[7][0]).toMatch(`'type' changed for column something.id { fromColumnType: 'int', toColumnType: 'varchar(255)' }`);
  expect(mock.mock.calls[8][0]).toMatch(`'autoincrement' changed for column something.id { fromColumn: { name: 'id', type: 'int4', mappedType: IntegerType {}, length: null, precision: 32, scale: 0, nullable: false, default: null, unsigned: true, autoincrement: true, comment: null, primary: true, unique: false, enumItems: [] }, toColumn: { name: 'id', type: 'varchar(255)', mappedType: StringType {}, unsigned: false, autoincrement: false, primary: true, nullable: false, length: 255 }}`);
  expect(mock.mock.calls[9][0]).toMatch(`column something.id changed { changedProperties: Set(2) { 'type', 'autoincrement' } }`);
});

test('create schema dump with serial property', async () => {
  const orm = await MikroORM.init({
    entities: [Something1],
    dbName: `mikro_orm_test_serial`,
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

test('hydration of serial property', async () => {
  const orm = await MikroORM.init({
    entities: [Something1],
    dbName: `mikro_orm_test_serial`,
  });

  await orm.schema.refreshDatabase();

  const e1 = new Something1();
  e1.foo = '1';
  await orm.em.persistAndFlush(e1);
  expect(e1._id).toBe(1);
  const e2 = new Something1();
  e2.foo = '2';
  const e3 = new Something1();
  e3.foo = '3';

  await orm.em.persistAndFlush([e2, e3]);
  expect(e2._id).toBe(2);
  expect(e3._id).toBe(3);

  await orm.close(true);
});
