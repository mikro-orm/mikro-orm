import { MikroORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
class User {

  @PrimaryKey({ type: 'number' })
  id?: number;

  @Property({ type: 'json' })
  value!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mo-test',
    port: 3308,
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close());

test('It should fetch record matching by json column', async () => {
  const user = new User();
  user.id = 1;
  user.value = 'test';
  await orm.em.fork().persistAndFlush(user);

  const c = await orm.em.findOne(User, { value: 'test' });
  expect(c).not.toBeNull();
});
