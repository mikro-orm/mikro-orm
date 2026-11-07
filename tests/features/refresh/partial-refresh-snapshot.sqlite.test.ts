import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

const Cart = defineEntity({
  name: 'Cart',
  properties: {
    id: p.integer().primary(),
    guestId: p.string(),
    audience: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Cart],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  orm.em.create(Cart, { id: 1, guestId: 'g1', audience: 'a1' });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('partial refresh keeps previously loaded properties in the snapshot', async () => {
  const em = orm.em.fork();
  const cart = await em.findOneOrFail(Cart, 1, { fields: ['guestId'] });
  const refreshed = await em.findOneOrFail(Cart, 1, { fields: ['audience'], refresh: true });
  expect(refreshed).toBe(cart);
  expect(cart.guestId).toBe('g1');
  expect(refreshed.audience).toBe('a1');

  const mock = mockLogger(orm, ['query']);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('partial refresh keeps unflushed changes to properties it does not load', async () => {
  const em = orm.em.fork();
  const cart = await em.findOneOrFail(Cart, 1, { fields: ['guestId'] });
  cart.guestId = 'g2';
  await em.findOneOrFail(Cart, 1, { fields: ['audience'], refresh: true });

  const mock = mockLogger(orm, ['query', 'query-params']);
  await em.flush();
  expect(mock.mock.calls[1][0]).toMatch("update `cart` set `guest_id` = 'g2' where `id` = 1");
});
