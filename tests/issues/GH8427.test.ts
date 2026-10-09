import { defineEntity, EntityManager, InferEntity, MikroORM, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

const Customer = defineEntity({
  name: 'Customer',
  properties: {
    id: p.integer().primary(),
    email: p.string().unique(),
    name: p.string(),
    amount: p.decimal().precision(12).scale(2).nullable(),
    score: p.decimal('number').nullable(),
    rate: p.double().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Customer], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.insert(Customer, { id: 1, email: 'foo@bar.com', name: 'Foo' });
});

afterAll(() => orm.close(true));

// `amount`, `score` and `rate` are omitted from the upsert data and come back as `null` via `returning`
async function assertNullsKept(em: EntityManager, customer: InferEntity<typeof Customer>) {
  expect(customer.amount).toBeNull();
  expect(customer.score).toBeNull();
  expect(customer.rate).toBeNull();

  const mock = mockLogger(orm, ['query']);
  customer.name = 'Baz';
  await em.flush();
  expect(mock.mock.calls[1][0]).toMatch('update `customer` set `name` = ? where `id` = ?');

  const [row] = await orm.em.getConnection().execute('select * from customer');
  expect(row).toMatchObject({ name: 'Baz', amount: null, score: null, rate: null });
}

test('em.upsertMany keeps omitted nullable custom type properties null', async () => {
  const em = orm.em.fork();
  const [customer] = await em.upsertMany(Customer, [{ email: 'foo@bar.com', name: 'Bar' }]);
  await assertNullsKept(em, customer);
});

test('em.upsert keeps omitted nullable custom type properties null', async () => {
  const em = orm.em.fork();
  const customer = await em.upsert(Customer, { email: 'foo@bar.com', name: 'Bar' });
  await assertNullsKept(em, customer);
});
