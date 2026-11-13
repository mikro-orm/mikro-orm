import { defineEntity, MikroORM, p, Type } from '@mikro-orm/sqlite';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { mockLogger } from '../../helpers.js';

class UpperCaseType extends Type<string, string> {
  convertToDatabaseValue(value: string): string {
    return value.toUpperCase();
  }

  convertToJSValue(value: string): string {
    return value.toLowerCase();
  }

  getColumnType(): string {
    return 'text';
  }
}

const Account = defineEntity({
  name: 'Account',
  properties: {
    id: p.integer().primary(),
    code: p.string().unique(),
    card: () => p.oneToOne(Card).mappedBy('account').ref().nullable(),
    payments: () => p.oneToMany(Payment).mappedBy('account'),
  },
});

const Card = defineEntity({
  name: 'Card',
  properties: {
    id: p.string().primary(),
    account: () => p.oneToOne(Account).inversedBy('card').targetKey('code').ref().nullable(),
  },
});

const Payment = defineEntity({
  name: 'Payment',
  properties: {
    id: p.integer().primary(),
    account: () => p.manyToOne(Account).targetKey('code').ref(),
  },
});

const Vendor = defineEntity({
  name: 'Vendor',
  properties: {
    id: p.integer().primary(),
    code: p.type(UpperCaseType).unique(),
    license: () => p.oneToOne(License).mappedBy('vendor').ref().nullable(),
  },
});

const License = defineEntity({
  name: 'License',
  properties: {
    id: p.string().primary(),
    vendor: () => p.oneToOne(Vendor).inversedBy('license').targetKey('code').ref().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Account, Card, Payment, Vendor, License],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const account = orm.em.create(Account, { id: 1, code: 'c1' });
  orm.em.create(Card, { id: 'k1', account });
  orm.em.create(Payment, { id: 1, account });
  const vendor = orm.em.create(Vendor, { id: 1, code: 'v1' });
  orm.em.create(License, { id: 'l1', vendor });
  await orm.em.flush();
});

afterAll(() => orm.close(true));

test.each(['select-in', 'joined'] as const)(
  'merging a populated targetKey many-to-one keeps the owner clean (%s)',
  async strategy => {
    const em = orm.em.fork();
    const payment = await em.findOneOrFail(Payment, 1, { fields: ['id'] });
    const payments = await em.find(Payment, {}, { populate: ['account'], strategy });
    expect(payments[0]).toBe(payment);
    expect(payments[0].account.unwrap().code).toBe('c1');

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test.each(['select-in', 'joined'] as const)(
  'merging a populated targetKey one-to-one keeps the owner clean (%s)',
  async strategy => {
    const em = orm.em.fork();
    const card = await em.findOneOrFail(Card, 'k1', { fields: ['id'] });
    const cards = await em.find(Card, {}, { populate: ['account'], strategy });
    expect(cards[0]).toBe(card);
    expect(cards[0].account!.unwrap().code).toBe('c1');

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test.each(['select-in', 'joined'] as const)(
  'merging a populated custom type targetKey keeps the owner clean (%s)',
  async strategy => {
    const em = orm.em.fork();
    const license = await em.findOneOrFail(License, 'l1', { fields: ['id'] });
    const licenses = await em.find(License, {}, { populate: ['vendor'], strategy });
    expect(licenses[0]).toBe(license);
    expect(licenses[0].vendor!.unwrap().code).toBe('v1');

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test('loading the inverse side of a targetKey 1:1 does not make the owner dirty', async () => {
  const em = orm.em.fork();
  await em.findOneOrFail(Account, 1);

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test.each(['select-in', 'joined'] as const)(
  'populating the inverse side of a targetKey relation does not make the owner dirty (%s)',
  async strategy => {
    const em = orm.em.fork();
    const account = await em.findOneOrFail(Account, 1, { populate: ['card', 'payments'], strategy });
    expect(account.card!.unwrap().account!.unwrap()).toBe(account);
    expect(account.payments[0].account.unwrap()).toBe(account);

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test('loading the inverse side of a custom type targetKey 1:1 does not make the owner dirty', async () => {
  const em = orm.em.fork();
  const vendor = await em.findOneOrFail(Vendor, 1);
  expect(vendor.code).toBe('v1');

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});
