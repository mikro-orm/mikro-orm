import { MikroORM, Entity, OptionalProps, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/postgresql';
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
    dbName: 'mikro_orm_test_gh_3810',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close();
});

test('3810', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);
  const u1 = orm.em.create(User, { options: ['foo,'] });
  await orm.em.flush();

  u1.options.push('asd,');
  u1.options.push('bar');
  u1.options.push(',baz');
  await orm.em.flush();

  await orm.em.refresh(u1);
  u1.options.push('qux,');
  await orm.em.flush();

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] insert into \"user\" (\"options\") values ('{\"foo,\"}') returning \"id\""],
    ['[query] commit'],
    ['[query] begin'],
    ["[query] update \"user\" set \"options\" = '{\"foo,\",\"asd,\",bar,\",baz\"}' where \"id\" = 1"],
    ['[query] commit'],
    ['[query] select "u0".* from "user" as "u0" where "u0"."id" = 1 limit 1'],
    ['[query] begin'],
    ["[query] update \"user\" set \"options\" = '{\"foo,\",\"asd,\",bar,\",baz\",\"qux,\"}' where \"id\" = 1"],
    ['[query] commit'],
  ]);
});
