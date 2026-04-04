import { MikroORM, type Opt, type Ref } from '@mikro-orm/mysql';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Transaction7486 {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'json' })
  details!: Record<string, any>;

  @Property({
    columnType: `varchar(50) generated always as (json_unquote(json_extract(details, '$.type'))) stored`,
    ignoreSchemaChanges: ['type', 'extra'],
  })
  type!: string & Opt;

  @Property({
    columnType: `decimal(10,2) generated always as (cast(json_unquote(json_extract(details, '$.amount')) as decimal(10,2))) stored`,
    nullable: true,
    ignoreSchemaChanges: ['type', 'extra'],
  })
  amount?: (number | string) & Opt;
}

@Entity()
class Credit7486 {
  @PrimaryKey()
  id!: number;

  @Property()
  reason!: string;

  @ManyToOne(() => Transaction7486, { ref: true })
  transaction!: Ref<Transaction7486>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Transaction7486, Credit7486],
    dbName: 'gh7486',
    port: 3308,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('generated columns should be hydrated when entity was a reference in identity map', async () => {
  // Seed data
  const em = orm.em.fork();

  const t1 = em.create(Transaction7486, {
    details: { type: 'Sale', amount: '240.00' },
  });
  const t2 = em.create(Transaction7486, {
    details: { type: 'Refund', amount: '50.00' },
  });

  em.create(Credit7486, { reason: 'signup bonus', transaction: t1 });
  em.create(Credit7486, { reason: 'referral', transaction: t2 });

  await em.flush();
  em.clear();

  // Simulate the GraphQL scenario: single request-scoped EM, two resolvers
  const requestEm = orm.em.fork();

  // Resolver A: load credits (creates transaction references in identity map)
  const credits = await requestEm.find(
    Credit7486,
    {},
    {
      orderBy: { id: 'asc' },
    },
  );

  // At this point, transaction references exist in the identity map but are uninitialized
  expect(credits).toHaveLength(2);

  // Resolver B: load transactions directly
  const transactions = await requestEm.find(
    Transaction7486,
    {},
    {
      orderBy: { id: 'asc' },
    },
  );

  // The generated columns should be properly hydrated
  expect(transactions).toHaveLength(2);
  expect(transactions[0].type).toBe('Sale');
  expect(transactions[0].amount).toBe('240.00');
  expect(transactions[1].type).toBe('Refund');
  expect(transactions[1].amount).toBe('50.00');
});

test('generated columns work when loading transactions directly (no prior references)', async () => {
  const em = orm.em.fork();

  const transactions = await em.find(
    Transaction7486,
    {},
    {
      orderBy: { id: 'asc' },
    },
  );

  expect(transactions).toHaveLength(2);
  expect(transactions[0].type).toBe('Sale');
  expect(transactions[0].amount).toBe('240.00');
  expect(transactions[1].type).toBe('Refund');
  expect(transactions[1].amount).toBe('50.00');
});
