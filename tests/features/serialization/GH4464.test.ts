import { Collection, MikroORM } from '@mikro-orm/sqlite';

import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  test1!: string;

  @ManyToMany({ entity: () => B, mappedBy: 'a' })
  b = new Collection<B>(this);

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  test2!: string;

  @Property()
  test3!: string;

  @ManyToMany({ entity: () => A, inversedBy: 'b' })
  a = new Collection<A>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [A, B],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close());

test('loadItems with fields (#4464)', async () => {
  const a = orm.em.create(A, { test1: 'yxcv', b: [
    { test2: 'qwer', test3: 'asdf' },
  ] });

  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOne(B, 1, { fields: ['test2'] });
  const a2 = await orm.em.findOneOrFail(A, 1);
  const test3 = (await a2.b.loadItems())[0].test3;
  expect(test3).toMatch('asdf');
});
