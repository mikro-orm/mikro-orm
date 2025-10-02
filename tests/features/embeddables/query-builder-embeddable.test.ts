import { MikroORM } from '@mikro-orm/better-sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Embeddable()
class Settings {

  @Property()
  name: string;

  constructor(settings: Settings) {
    this.name = settings.name;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id: number;

  @Embedded(() => Settings)
  settings: Settings;

  constructor(user: User) {
    this.id = user.id;
    this.settings = new Settings(user.settings);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ User, Settings ],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));
afterEach(async () => {
  orm.em.clear();
  await orm.schema.refreshDatabase();
});

test('insert an object with embeddable using a QueryBuilder', async () => {
  const foo = new User({ id: 1, settings: { name: 'foo' } });
  const bar = new User({ id: 2, settings: { name: 'bar' } });
  const repo = orm.em.getRepository(User);

  await repo.createQueryBuilder().insert([ foo, bar ]);

  expect(await repo.findOneOrFail(1)).toEqual(foo);
  expect(await repo.findOneOrFail(2)).toEqual(bar);
});

test('update an object with embeddable using a QueryBuilder', async () => {
  const foo = new User({ id: 1, settings: { name: 'eh' } });
  const bar = new User({ id: 2, settings: { name: 'oh' } });

  await orm.em.persistAndFlush([ foo, bar ]);

  const repo = orm.em.getRepository(User);

  await repo.createQueryBuilder().update({ settings: foo.settings }).where({ id: foo.id });
  await repo.createQueryBuilder().update({ settings: bar.settings }).where({ id: bar.id });

  expect(await repo.findOneOrFail(1)).toEqual(foo);
  expect(await repo.findOneOrFail(2)).toEqual(bar);
});

test('should be able to query against embeddable properties', async () => {
  const foo = new User({ id: 1, settings: { name: 'eh' } });
  const bar = new User({ id: 2, settings: { name: 'oh' } });

  await orm.em.persistAndFlush([ foo, bar ]);

  const repo = orm.em.getRepository(User);

  await expect(repo.createQueryBuilder()
    .where({ settings: { name: 'eh' } })
    .getResult()).resolves.toEqual([foo]);
});
