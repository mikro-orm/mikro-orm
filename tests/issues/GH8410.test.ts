import { defineEntity, MikroORM, p, Type } from '@mikro-orm/sqlite';

class Money {
  constructor(readonly cents: number) {}
}

class MoneyType extends Type<Money, number> {
  override convertToDatabaseValue(value: Money): number {
    if (!(value instanceof Money)) {
      throw new Error(`Expected Money, got ${typeof value}`);
    }

    return value.cents;
  }

  override convertToJSValue(value: number): Money {
    return new Money(Number(value));
  }

  override toJSON(value: Money): number {
    return value.cents;
  }
}

const Balance = defineEntity({
  name: 'Balance',
  embeddable: true,
  properties: {
    value: p.bigint(),
    price: p.type(MoneyType),
  },
});

const Counter = defineEntity({
  name: 'Counter',
  properties: {
    id: p.integer().primary(),
    value: p.bigint(),
    price: p.type(MoneyType),
    inline: () => p.embedded(Balance),
    object: () => p.embedded(Balance).object(),
    history: () => p.embedded(Balance).array(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Counter, Balance], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const em = orm.em.fork();
  em.create(Counter, {
    id: 1,
    value: 5n,
    price: new Money(150),
    inline: { value: 7n, price: new Money(1) },
    object: { value: 9n, price: new Money(2) },
    history: [{ value: 3n, price: new Money(3) }],
  });
  await em.flush();
});

afterAll(() => orm.close(true));

test('em.refresh() keeps runtime values of custom types', async () => {
  const em = orm.em.fork();
  const counter = await em.findOneOrFail(Counter, 1);
  await em.refresh(counter);
  expect(counter.value).toBe(5n);
  expect(counter.price).toBeInstanceOf(Money);
  expect(counter.inline.value).toBe(7n);
  expect(counter.object.value).toBe(9n);
  expect(counter.object.price).toBeInstanceOf(Money);
  expect(counter.history[0].price).toBeInstanceOf(Money);

  counter.value += 1n;
  counter.price = new Money(200);
  counter.inline.value += 1n;
  counter.object.value += 1n;
  await em.flush();

  const persisted = await orm.em.fork().findOneOrFail(Counter, 1);
  expect(persisted.value).toBe(6n);
  expect(persisted.price.cents).toBe(200);
  expect(persisted.inline.value).toBe(8n);
  expect(persisted.object.value).toBe(10n);
});

test('em.refresh() keeps runtime values of custom types on detached entity', async () => {
  const em = orm.em.fork();
  const counter = await em.findOneOrFail(Counter, 1);
  em.clear();
  await em.refresh(counter);
  expect(counter.value).toBe(5n);
  expect(counter.price).toBeInstanceOf(Money);
  expect(counter.inline.value).toBe(7n);
  expect(counter.object.value).toBe(9n);
});
