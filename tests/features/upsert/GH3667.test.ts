import { Entity, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    loggerFactory: options => new SimpleLogger(options),
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 3667', async () => {
  const mock = mockLogger(orm);
  const user1 = new User();
  orm.em.persist(user1);
  await orm.em.flush();

  await orm.em.repo(User).upsert({ id: 1, name: 'john' });
  await orm.em.flush();

  await orm.em.refresh(user1);
  expect(user1.name).toEqual('john');

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `user` (`id`) select null as `id` returning `id`'],
    ['[query] commit'],
    ['[query] begin'],
    ["[query] update `user` set `name` = 'john' where `id` = 1"],
    ['[query] commit'],
    ['[query] select `u0`.* from `user` as `u0` where `u0`.`id` = 1 limit 1'],
  ]);
});
