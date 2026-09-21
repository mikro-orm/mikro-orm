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

const Credentials = defineEntity({
  name: 'Credentials',
  embeddable: true,
  properties: {
    value: p.string().fieldName('credentials'),
    salt: p.string(),
  },
});

const Address = defineEntity({
  name: 'Address',
  embeddable: true,
  properties: {
    city: p.string(),
    street: p.string(),
    label: p.string().persist(false),
  },
});

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    password: p.embedded(Password).prefix(''),
    credentials: p.embedded(Credentials).prefix(''),
    address: p.embedded(Address),
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
    entities: [Profile, User, Password, Credentials, Address],
    dbName: ':memory:',
  });
  await orm.schema.create();
  orm.em.create(Profile, {
    id: 1,
    nickname: 'foo',
    user: {
      id: 1,
      password: { value: 'hash' },
      credentials: { value: 'token', salt: 'pepper' },
      address: { city: 'London', street: 'Baker' },
    },
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('GH #8292 joined populate of an inline embeddable whose column matches the property name', async () => {
  const mock = mockLogger(orm);
  const em = orm.em.fork();
  const profile = await em.findOneOrFail(Profile, 1, { populate: ['user'] });
  expect(profile.user.password).toEqual({ value: 'hash' });
  expect(profile.user.credentials).toEqual({ value: 'token', salt: 'pepper' });
  expect(mock.mock.calls[0][0]).toMatch(
    'select `p0`.*, `u1`.`id` as `u1__id`, `u1`.`password` as `u1__password`, `u1`.`credentials` as `u1__credentials`, `u1`.`salt` as `u1__salt`, `u1`.`address_city` as `u1__address_city`, `u1`.`address_street` as `u1__address_street` from `profile` as `p0` inner join `user` as `u1` on `p0`.`user_id` = `u1`.`id` where `p0`.`id` = 1',
  );

  profile.nickname = 'bar';
  mock.mockClear();
  await em.flush();
  expect(mock.mock.calls.map(c => c[0])).toEqual([
    expect.stringMatching('begin'),
    expect.stringMatching("update `profile` set `nickname` = 'bar' where `id` = 1"),
    expect.stringMatching('commit'),
  ]);
});

test('GH #8292 explicit alias on an inline embeddable expanding to a single column', async () => {
  const qb = orm.em.qb(User, 'u').select(['u.id', 'u.password as pwd']);
  expect(qb.getFormattedQuery()).toBe('select `u`.`id`, `u`.`password` as `pwd` from `user` as `u`');
});

test('GH #8292 columns of a multi-column inline embeddable are qualified with the join alias', async () => {
  const qb = orm.em.qb(Profile, 'p').leftJoin('p.user', 'u').select(['p.id', 'u.address']);
  expect(qb.getFormattedQuery()).toBe(
    'select `p`.`id`, `u`.`address_city`, `u`.`address_street` from `profile` as `p` left join `user` as `u` on `p`.`user_id` = `u`.`id`',
  );
});
