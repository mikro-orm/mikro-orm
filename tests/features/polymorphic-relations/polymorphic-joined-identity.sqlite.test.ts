import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Invoice = defineEntity({
  name: 'Invoice',
  properties: {
    id: p.bigint().primary(),
    note: p.string(),
  },
});

const Receipt = defineEntity({
  name: 'Receipt',
  properties: {
    id: p.bigint().primary(),
    note: p.string(),
  },
});

const Payment = defineEntity({
  name: 'Payment',
  properties: {
    id: p.integer().primary(),
    document: () => p.manyToOne([Invoice, Receipt]),
  },
});

const Page = defineEntity({
  name: 'Page',
  properties: {
    site: p.integer().primary(),
    path: p.string().primary(),
    title: p.string(),
  },
});

const Asset = defineEntity({
  name: 'Asset',
  properties: {
    site: p.integer().primary(),
    path: p.string().primary(),
    title: p.string(),
  },
});

const Visit = defineEntity({
  name: 'Visit',
  properties: {
    id: p.integer().primary(),
    subject: () => p.manyToOne([Page, Asset]),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Invoice, Receipt, Payment, Page, Asset, Visit],
    dbName: ':memory:',
  });
  await orm.schema.create();

  orm.em.create(Payment, { id: 1, document: orm.em.create(Receipt, { id: 5n, note: 'r5' }) });
  orm.em.create(Visit, { id: 1, subject: orm.em.create(Asset, { site: 1, path: '/logo', title: 'logo' }) });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test.each(['select-in', 'joined'] as const)(
  'populating a polymorphic relation with bigint PK targets (%s)',
  async strategy => {
    const em = orm.em.fork();
    const payment = await em.findOneOrFail(Payment, 1, { populate: ['document'], strategy });
    expect(payment.document).toBeInstanceOf(Receipt.class);
    expect(payment.document).toMatchObject({ id: 5n, note: 'r5' });
  },
);

test.each(['select-in', 'joined'] as const)(
  'populating a polymorphic relation reuses the already loaded bigint PK target (%s)',
  async strategy => {
    const em = orm.em.fork();
    const receipt = await em.findOneOrFail(Receipt, 5n);
    const payment = await em.findOneOrFail(Payment, 1, { populate: ['document'], strategy });
    expect(payment.document).toBe(receipt);
  },
);

test.each(['select-in', 'joined'] as const)(
  'populating a polymorphic relation reuses the already loaded composite PK target (%s)',
  async strategy => {
    const em = orm.em.fork();
    const asset = await em.findOneOrFail(Asset, { site: 1, path: '/logo' });
    const visit = await em.findOneOrFail(Visit, 1, { populate: ['subject'], strategy });
    expect(visit.subject).toBe(asset);
  },
);
