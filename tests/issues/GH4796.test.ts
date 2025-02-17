import {
  Entity,
  OptionalProps,
  PrimaryKey,
  Property,
  SimpleLogger,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

@Entity()
class User {

  [OptionalProps]?: 'options';

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string[]', default: ['foo'] })
  options = ['foo'];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: 'mikro_orm_test_gh_4796',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close();
});

test('4796', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);
  const u1 = orm.em.create(User, { options: ['\\'] });
  await orm.em.flush();

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    [
      '[query] insert into "user" ("options") values ( E\'{"\\\\\\\\"}\') returning "id"',
    ],
    ['[query] commit'],
  ]);

  const ud = await orm.em.fork().findOne(User, { id: u1.id });

  expect(ud).toEqual({ id: 1, options: ['\\'] });
});
