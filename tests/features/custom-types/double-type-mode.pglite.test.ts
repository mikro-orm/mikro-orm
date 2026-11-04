import { defineEntity, MikroORM, p } from '@mikro-orm/pglite';

const Measurement = defineEntity({
  name: 'Measurement',
  properties: {
    id: p.integer().primary(),
    rate: p.double(),
    ratio: p.double('number'),
    precise: p.double('string'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Measurement], dbName: 'memory://' });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('double properties hydrate according to their mode', async () => {
  orm.em.create(Measurement, { id: 1, rate: 1.5, ratio: 2.25, precise: '3.125' });
  await orm.em.flush();
  orm.em.clear();

  const m = await orm.em.findOneOrFail(Measurement, 1);
  expect(m.rate).toBe(1.5);
  expect(m.ratio).toBe(2.25);
  expect(m.precise).toBe('3.125');

  const meta = orm.getMetadata().get(Measurement);
  expect(meta.properties.rate.runtimeType).toBe('number');
  expect(meta.properties.ratio.runtimeType).toBe('number');
  expect(meta.properties.precise.runtimeType).toBe('string');

  // no false-positive change detection after hydration
  await orm.em.flush();
  expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
});
