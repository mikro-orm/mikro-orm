import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';

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

  @Embedded({ entity: 'Settings' })
  settings: Settings;

  constructor(user: User) {
    this.id = user.id;
    this.settings = new Settings(user.settings);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Settings],
    dbName: ':memory:',
  });

  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));
afterEach(() => orm.em.clear());

test('insert an object with embeddable using a QueryBuilder', async () => {
  const foo = new User({ id: 1, settings: { name: 'foo' } });
  const bar = new User({ id: 2, settings: { name: 'bar' } });
  const repo = orm.em.getRepository(User);

  await repo.createQueryBuilder().insert([foo, bar]).execute();

  expect(await repo.findOneOrFail(1)).toEqual(foo);
  expect(await repo.findOneOrFail(2)).toEqual(bar);
});

test('update an object with embeddable using a QueryBuilder', async () => {
  const foo = new User({ id: 1, settings: { name: 'eh' } });
  const bar = new User({ id: 2, settings: { name: 'oh' } });
  const repo = orm.em.getRepository(User);

  await repo.createQueryBuilder().update({ settings: foo.settings }).where({ id: foo.id }).execute();
  await repo.createQueryBuilder().update({ settings: bar.settings }).where({ id: bar.id }).execute();

  expect(await repo.findOneOrFail(1)).toEqual(foo);
  expect(await repo.findOneOrFail(2)).toEqual(bar);
});
