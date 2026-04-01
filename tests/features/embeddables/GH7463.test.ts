import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Embeddable()
class InnerEmbeddable {

  @Property()
  name!: string;

}

@Embeddable()
class OuterEmbeddable {

  @Embedded(() => InnerEmbeddable, { nullable: true })
  inner?: InnerEmbeddable;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => OuterEmbeddable, { nullable: true })
  outer?: OuterEmbeddable;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7463 - snapshot generator', async () => {
  const comparator = orm.em.getComparator();
  const snapshotGenerator = comparator.getSnapshotGenerator('User');
  expect(snapshotGenerator.toString()).toMatchSnapshot();
});

test('GH #7463', async () => {
  orm.em.create(User, {
    name: 'Foo',
    outer: {
      inner: { name: 'inner' },
    },
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { name: 'Foo' });
  expect(user.outer!.inner!.name).toBe('inner');
  orm.em.assign(user, { outer: null });
  await orm.em.flush();
  orm.em.clear();

  const userAfter = await orm.em.findOneOrFail(User, { name: 'Foo' });
  expect(userAfter.outer).toBeNull();
});

test('GH #7463 - create after null', async () => {
  orm.em.create(User, {
    name: 'Bar',
    outer: {
      inner: { name: 'nested' },
    },
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { name: 'Bar' });
  expect(user.outer!.inner!.name).toBe('nested');
  orm.em.assign(user, { outer: null });
  await orm.em.flush();
  orm.em.clear();

  const user2 = await orm.em.findOneOrFail(User, { name: 'Bar' });
  expect(user2.outer).toBeNull();

  // re-assign and verify it persists correctly
  orm.em.assign(user2, { outer: { inner: { name: 'new' } } });
  await orm.em.flush();
  orm.em.clear();

  const user3 = await orm.em.findOneOrFail(User, { name: 'Bar' });
  expect(user3.outer!.inner!.name).toBe('new');
});
