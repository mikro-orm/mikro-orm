import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import {
  Entity,
  MikroORM,
  PrimaryKey,
  Embedded,
  Embeddable,
  Property,
} from '@mikro-orm/core';

@Embeddable()
export class Settings {

  @Property()
  name: string;

  constructor(settings: Settings) {
    this.name = settings.name;
  }

}

@Entity()
export class User {

  @PrimaryKey()
  id: number;

  @Embedded({ entity: 'Settings' })
  settings: Settings;

  constructor(user: User) {
    this.id = user.id;
    this.settings = new Settings(user.settings);
  }

}

let orm: MikroORM<BetterSqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Settings],
    dbName: ':memory:',
    driver: BetterSqliteDriver,
  });

  const generator = orm.schema;
  await generator.ensureDatabase();
  await generator.dropSchema();
  await generator.createSchema();
});

afterAll(() => orm.close(true));

test('insert an object with embeddable using a QueryBuilder', async () => {
  const foo = new User({ id: 1, settings: { name: 'foo' } });
  const bar = new User({ id: 2, settings: { name: 'bar' } });
  const repo = orm.em.getRepository(User);

  await repo.createQueryBuilder().insert([foo, bar]);

  expect(await repo.findOneOrFail(1)).toEqual(foo);
  expect(await repo.findOneOrFail(2)).toEqual(bar);
});

test('update an object with embeddable using a QueryBuilder', async () => {
  const foo = new User({ id: 1, settings: { name: 'eh' } });
  const bar = new User({ id: 2, settings: { name: 'oh' } });
  const repo = orm.em.getRepository(User);

  await repo.createQueryBuilder().update({ settings: foo.settings }).where({ id: foo.id });
  await repo.createQueryBuilder().update({ settings: bar.settings }).where({ id: bar.id });

  expect(await repo.findOneOrFail(1)).toEqual(foo);
  expect(await repo.findOneOrFail(2)).toEqual(bar);
});
