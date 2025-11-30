import { MikroORM, t } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class Asset1 {

  @PrimaryKey({ columnType: 'bigint' })
  id!: bigint;

  @Property()
  name!: string;

}

@Entity()
export class Asset2 {

  @PrimaryKey({ type: 'bigint' })
  id!: bigint;

  @Property()
  name!: string;

}

@Entity()
export class Asset3 {

  @PrimaryKey({ type: t.bigint })
  id!: bigint;

  @Property()
  name!: string;

}

test('bigint in mysql 1/3', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: `mikro_orm_test_gh_3739`,
    port: 3308,
    entities: [Asset1],
  });
  await orm.schema.refreshDatabase();

  const a1 = orm.em.create(Asset1, {
    name: 'foo',
  });
  const a2 = orm.em.create(Asset1, {
    id: 90071992547409923n,
    name: 'foo',
  });
  await orm.em.flush();
  expect(typeof a1.id).toBe('bigint');
  const a3 = await orm.em.fork().findOneOrFail(Asset1, a1);
  expect(typeof a3.id).toBe('bigint');
  const a4 = await orm.em.fork().findOneOrFail(Asset1, a2);
  expect(typeof a4.id).toBe('bigint');

  await orm.close(true);
});

test('bigint in mysql 2/3', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: `mikro_orm_test_gh_3739`,
    port: 3308,
    entities: [Asset2],
  });
  await orm.schema.refreshDatabase();

  const a1 = orm.em.create(Asset2, {
    name: 'foo',
  });
  await orm.em.flush();
  expect(typeof a1.id).toBe('bigint');
  const a2 = await orm.em.fork().findOneOrFail(Asset2, a1);
  expect(typeof a2.id).toBe('bigint');

  await orm.close(true);
});

test('bigint in mysql 3/3', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: `mikro_orm_test_gh_3739`,
    port: 3308,
    entities: [Asset3],
  });
  await orm.schema.refreshDatabase();

  const a1 = orm.em.create(Asset3, {
    name: 'foo',
  });
  await orm.em.flush();
  expect(typeof a1.id).toBe('bigint');
  const a2 = await orm.em.fork().findOneOrFail(Asset3, a1);
  expect(typeof a2.id).toBe('bigint');

  await orm.close(true);
});
