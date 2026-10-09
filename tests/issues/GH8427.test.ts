import { Entity, EntityManager, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

@Entity()
class Customer {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  email!: string;

  @Property()
  name!: string;

  @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount?: string | null;

  @Property({ type: 'decimal', runtimeType: 'number', nullable: true })
  score?: number | null;

  @Property({ type: 'double', nullable: true })
  rate?: number | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Customer], dbName: ':memory:' });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  await orm.em.insert(Customer, { id: 1, email: 'foo@bar.com', name: 'Foo' });
});

afterAll(() => orm.close(true));

// `amount`, `score` and `rate` are omitted from the upsert data and come back as `null` via `returning`
async function assertNullsKept(em: EntityManager, customer: Customer) {
  const mock = mockLogger(orm, ['query']);
  customer.name = 'Baz';
  await em.flush();

  const [row] = await orm.em.getConnection().execute('select * from customer');
  expect(row).toMatchObject({ name: 'Baz', amount: null, score: null, rate: null });
  expect(mock.mock.calls[1][0]).toMatch('update `customer` set `name` = ? where `id` = ?');
  expect(customer.amount).toBeNull();
  expect(customer.score).toBeNull();
  expect(customer.rate).toBeNull();
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
