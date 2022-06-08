import { Entity,  MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

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

test('schema generator works with non-pk autoincrement columns (serial)', async () => {
  const orm = await MikroORM.init({
    entities: [Something0],
    dbName: `mikro_orm_test_serial`,
    type: 'postgresql',
    schemaGenerator: { disableForeignKeys: false },
  });

  const generator = orm.getSchemaGenerator();
  await generator.refreshDatabase();
  await expect(generator.getUpdateSchemaSQL()).resolves.toBe('');

  await orm.discoverEntity(Something1);
  orm.getMetadata().reset('Something0');
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

  await orm.close(true);
});

test('create schema dump with serial property', async () => {
  const orm = await MikroORM.init({
    entities: [Something1],
    dbName: `mikro_orm_test_serial`,
    type: 'postgresql',
    schemaGenerator: { disableForeignKeys: false },
    debug: ['schema'],
  });

  await orm.getSchemaGenerator().refreshDatabase();
  const create = await orm.getSchemaGenerator().getCreateSchemaSQL();
  expect(create).toMatch('create table "something" ("id" serial primary key, "_id" serial, "foo" varchar(255) not null);');
  const diff = await orm.getSchemaGenerator().getUpdateSchemaSQL();
  expect(diff).toBe('');

  await orm.close(true);
});
