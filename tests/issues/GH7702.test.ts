// GH #7702 - `LockMode.NONE` should behave like `lockMode: undefined` and serve `findOne` from the identity map
import { defineEntity, LockMode, MikroORM, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

const User = defineEntity({
  name: 'User7702',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    allowGlobalContext: true,
  });
  await orm.schema.refresh();
  orm.em.create(User, { id: 1, name: 'Alice' });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7702 - LockMode.NONE serves findOne from identity map (matches undefined)', async () => {
  await orm.em.findOneOrFail(User, 1);

  const mock = mockLogger(orm);

  await orm.em.findOneOrFail(User, 1);
  await orm.em.findOneOrFail(User, 1, { lockMode: undefined });
  await orm.em.findOneOrFail(User, 1, { lockMode: LockMode.NONE });

  const selectCount = mock.mock.calls.filter(([msg]) => /select/i.test(String(msg))).length;
  expect(selectCount).toBe(0);
});
