import { Entity, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
class User {

  @PrimaryKey()
  id: number;

  @Property({ unique: true })
  email: string;

  constructor(id: number, email: string) {
   this.id = id;
   this.email = email;
  }

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

test('GH issue 4602', async () => {
  const mock = mockLogger(orm);
  const user1 = new User(123, 'test@test.com');
  await orm.em.upsert(User, user1, { onConflictFields: ['email'] });

  const user2 = new User(456, 'test@test.com');
  await orm.em.upsert(User, user2, { onConflictFields: ['email'] });

  expect(mock.mock.calls).toEqual([
    ['[query] insert into `user` (`email`, `id`) values (\'test@test.com\', 123) on conflict (`email`) do update set `id` = excluded.`id`'],
    ['[query] insert into `user` (`email`, `id`) values (\'test@test.com\', 456) on conflict (`email`) do update set `id` = excluded.`id`'],
  ]);
});
