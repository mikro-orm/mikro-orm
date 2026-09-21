import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

const Password = defineEntity({
  name: 'Password',
  embeddable: true,
  properties: {
    value: p.string().fieldName('password'),
  },
});

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    password: p.embedded(Password).prefix(''),
  },
});

const Profile = defineEntity({
  name: 'Profile',
  properties: {
    id: p.integer().primary(),
    nickname: p.string(),
    user: p.manyToOne(User),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Profile, User, Password],
    dbName: ':memory:',
  });
  await orm.schema.create();
  orm.em.create(Profile, { id: 1, nickname: 'foo', user: { id: 1, password: { value: 'hash' } } });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('GH #8292 joined populate of an inline embeddable whose column matches the property name', async () => {
  const mock = mockLogger(orm);
  const em = orm.em.fork();
  const profile = await em.findOneOrFail(Profile, 1, { populate: ['user'] });
  expect(profile.user.password).toEqual({ value: 'hash' });
  expect(mock.mock.calls[0][0]).toMatch(
    'select `p0`.*, `u1`.`id` as `u1__id`, `u1`.`password` as `u1__password` from `profile` as `p0` inner join `user` as `u1` on `p0`.`user_id` = `u1`.`id` where `p0`.`id` = 1',
  );

  profile.nickname = 'bar';
  mock.mockClear();
  await em.flush();
  expect(mock.mock.calls.map(c => c[0]).join('\n')).not.toMatch('update `user`');
});
