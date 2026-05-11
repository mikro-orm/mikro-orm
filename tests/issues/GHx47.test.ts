// `em.lock(entity, LockMode.NONE)` should be a no-op (no SQL issued), not a pessimistic SELECT FOR UPDATE
import { defineEntity, LockMode, MikroORM, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

const User = defineEntity({
  name: 'UserLockNone',
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
});

afterAll(async () => {
  await orm.close(true);
});

test('em.lock with LockMode.NONE is a no-op', async () => {
  const user = await orm.em.findOneOrFail(User, 1);
  const mock = mockLogger(orm);

  await expect(orm.em.lock(user, LockMode.NONE)).resolves.toBeUndefined();
  expect(mock.mock.calls.filter(([msg]) => /select|for update/i.test(String(msg))).length).toBe(0);
});
