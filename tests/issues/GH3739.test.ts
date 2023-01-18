import { Entity, PrimaryKey, Property, t } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';

@Entity()
export class Asset1 {

  @PrimaryKey({ columnType: 'bigint' })
  id!: string;

  @Property()
  name!: string;

}

@Entity()
export class Asset2 {

  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property()
  name!: string;

}

@Entity()
export class Asset3 {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @Property()
  name!: string;

}

test('bigint in mysql 1/3', async () => {
  const orm = await MikroORM.init({
    dbName: `mikro_orm_test_gh_3739`,
    port: 3308,
    entities: [Asset1],
  });
  await orm.schema.refreshDatabase();

  const a1 = orm.em.create(Asset1, {
    name: 'foo',
  });
  const a2 = orm.em.create(Asset1, {
    id: '90071992547409923',
    name: 'foo',
  });
  await orm.em.flush();
  expect(typeof a1.id).toBe('string');
  const a3 = await orm.em.fork().findOneOrFail(Asset1, a1);
  expect(typeof a3.id).toBe('string');
  const a4 = await orm.em.fork().findOneOrFail(Asset1, a2);
  expect(typeof a4.id).toBe('string');

  await orm.close(true);
});

test('bigint in mysql 2/3', async () => {
  const orm = await MikroORM.init({
    dbName: `mikro_orm_test_gh_3739`,
    port: 3308,
    entities: [Asset2],
  });
  await orm.schema.refreshDatabase();

  const a1 = orm.em.create(Asset2, {
    name: 'foo',
  });
  await orm.em.flush();
  expect(typeof a1.id).toBe('string');
  const a2 = await orm.em.fork().findOneOrFail(Asset2, a1);
  expect(typeof a2.id).toBe('string');

  await orm.close(true);
});

test('bigint in mysql 3/3', async () => {
  const orm = await MikroORM.init({
    dbName: `mikro_orm_test_gh_3739`,
    port: 3308,
    entities: [Asset3],
  });
  await orm.schema.refreshDatabase();

  const a1 = orm.em.create(Asset3, {
    name: 'foo',
  });
  await orm.em.flush();
  expect(typeof a1.id).toBe('string');
  const a2 = await orm.em.fork().findOneOrFail(Asset3, a1);
  expect(typeof a2.id).toBe('string');

  await orm.close(true);
});
