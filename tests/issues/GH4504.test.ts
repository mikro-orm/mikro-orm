import {
  Collection,
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  OneToMany,
  Ref, OptionalProps,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @OneToMany({ entity: () => B, mappedBy: 'a' })
  b = new Collection<B>(this);

}

@Entity()
class B {

  [OptionalProps]?: 'a';

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => A, persist: false, fieldName: 'test' })
  a!: Ref<A>;

  @Property()
  test!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [A, B],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close());

test('test1', async () => {
  orm.em.create(A, { b: [{ test: 123 }] });
  await orm.em.flush();
});

test('test2', async () => {
  orm.em.create(A, {});
  orm.em.create(B, { test: 123 });
  await orm.em.flush();
});

test('test3', async () => {
  const a = orm.em.create(A, {});
  const b = orm.em.create(B, { test: 123 });
  a.b.add(b);
  await orm.em.flush();
});

test('test4', async () => {
  const a = orm.em.create(A, {});
  await orm.em.flush();
  const b = orm.em.create(B, { test: 123 });
  a.b.add(b);
  await orm.em.flush();
});
