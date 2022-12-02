import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: string;

  @Property({ type: 'json' })
  data!: { id: string };

}

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3054`, async () => {
  await orm.em.nativeInsert(User, { id: '123', data: { id: 'test' } });
  const r = await orm.em.findOneOrFail(User, {
    data: {
      id: 'test',
    },
  });
  expect(r.data.id).toBe('test');
});
