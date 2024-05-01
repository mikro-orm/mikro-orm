import { MikroORM, Entity, Opt, PrimaryKey, Property, ref, Ref } from '@mikro-orm/sqlite';

@Entity()
class EntityWithScalarReferenceProperty {

  @PrimaryKey()
  readonly id!: bigint;

  @Property({ ref: true, onCreate: () => ref('Some default string') })
  someScalarRefProperty!: Opt<Ref<string>>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [EntityWithScalarReferenceProperty],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('create entity with providing value to ScalarRef property', async () => {
  const entity = orm.em.create(EntityWithScalarReferenceProperty, { someScalarRefProperty: 'some value' });

  await expect(orm.em.flush()).resolves.not.toThrow();
  expect(entity.someScalarRefProperty.unwrap()).toEqual('some value');
  expect(entity.someScalarRefProperty.isInitialized()).toEqual(true);
});

test('create entity without providing a value and relying to onCreate method', async () => {
  const entity = orm.em.create(EntityWithScalarReferenceProperty, {});
  await expect(orm.em.flush()).resolves.not.toThrow();
  expect(entity.someScalarRefProperty.unwrap()).toEqual('Some default string');
  expect(entity.someScalarRefProperty.isInitialized()).toEqual(true);
});
