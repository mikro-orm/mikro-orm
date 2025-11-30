import { defineEntity, MikroORM, type ObjectHydrator } from '@mikro-orm/sqlite';

export const User = defineEntity({
  name: 'User',
  properties: p => {
    return {
      id: p.bigint().primary(),
      uuid: p.text().unique(),
      email: p.string().unique(),
      firstName: p.string().nullable(),
      lastName: p.string().nullable(),
      password: p.string().hidden(),
      allowedTokens: () => p.oneToMany(AllowedToken).mappedBy('user'),
    };
  },
});

export const AllowedToken = defineEntity({
  name: 'AllowedToken',
  properties: p => {
    return {
      id: p.bigint().$type<bigint>().primary(),
      refreshToken: p.string(),
      exp: p.datetime().nullable(),
      user: () => p.manyToOne(User),
    };
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, AllowedToken],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('6865', async () => {
  const allowedToken = orm.em.create(AllowedToken, {
    refreshToken: '',
    user: 123n,
  });

  const user = orm.em.create(User, {
    email: 'test@gmail.com',
    password: 'test',
    uuid: '...',
  });

  const hydrator = orm.config.getHydrator(orm.getMetadata()) as ObjectHydrator;
  expect(hydrator.getEntityHydrator(orm.getMetadata().get(User), 'full').toString()).toMatchSnapshot();
  expect(orm.em.getComparator().getSnapshotGenerator(User).toString()).toMatchSnapshot();
});

