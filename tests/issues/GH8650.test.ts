import { DecimalType, EntitySchema, MikroORM } from '@mikro-orm/sqlite';

abstract class Pricing {
  type!: 'fixed' | 'percent';
}

class FixedPricing extends Pricing {
  declare type: 'fixed';
  amount!: number;
  min!: string;
}

class PercentPricing extends Pricing {
  declare type: 'percent';
  rate!: string;
  min!: string;
}

class Fee {
  id!: number;
  pricing!: FixedPricing | PercentPricing;
}

const PricingSchema = new EntitySchema({
  class: Pricing,
  embeddable: true,
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    type: { enum: true, items: ['fixed', 'percent'] },
  },
});

const FixedPricingSchema = new EntitySchema({
  class: FixedPricing,
  extends: PricingSchema,
  embeddable: true,
  discriminatorValue: 'fixed',
  properties: {
    amount: { type: 'integer', nullable: true },
    min: { type: new DecimalType('string'), columnType: 'numeric(10,2)', nullable: true },
  },
});

const PercentPricingSchema = new EntitySchema({
  class: PercentPricing,
  extends: PricingSchema,
  embeddable: true,
  discriminatorValue: 'percent',
  properties: {
    rate: { type: new DecimalType('string'), columnType: 'numeric(7,6)', nullable: true },
    min: { type: new DecimalType('string'), columnType: 'numeric(10,2)', nullable: true },
  },
});

const FeeSchema = new EntitySchema({
  class: Fee,
  properties: {
    id: { type: 'integer', primary: true },
    pricing: { kind: 'embedded', entity: () => [FixedPricing, PercentPricing] },
  },
});

const init = () =>
  MikroORM.init({
    entities: [FeeSchema, PricingSchema, FixedPricingSchema, PercentPricingSchema],
    dbName: ':memory:',
  });

test('a polymorphic embeddable property with a custom type instance is not renamed', async () => {
  const orm1 = await init();
  const orm2 = await init();

  const keys = (orm: MikroORM) =>
    Object.keys(orm.getMetadata().getByClassName('FixedPricing | PercentPricing').properties).sort();

  expect(keys(orm1)).toEqual(['amount', 'min', 'rate', 'type']);
  expect(keys(orm2)).toEqual(keys(orm1));

  await orm1.schema.create();
  const em = orm1.em.fork();
  const fee = em.create(Fee, { id: 1, pricing: { type: 'percent', rate: '0.025', min: '1.5' } as PercentPricing });
  await em.flush();
  em.clear();

  const loaded = await em.findOneOrFail(Fee, fee.id);
  expect(loaded.pricing).toBeInstanceOf(PercentPricing);
  expect((loaded.pricing as PercentPricing).rate).toBe('0.025');
  expect(loaded.pricing.min).toBe('1.5');

  await orm1.close(true);
  await orm2.close(true);
});
