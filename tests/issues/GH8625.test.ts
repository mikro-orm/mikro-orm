import { MikroORM } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Embeddable()
class Loyalty {
  @Property()
  tier!: string;

  @Property()
  points!: number;
}

@Embeddable()
class Features {
  @Property()
  reviews!: boolean;

  @Embedded(() => Loyalty)
  loyalty!: Loyalty;
}

@Entity()
class Brand {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => Features)
  features!: Features;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Brand],
  });
  await orm.schema.create();
  orm.em.create(Brand, { id: 1, name: 'b', features: { reviews: true, loyalty: { tier: 'gold', points: 10 } } });
  await orm.em.flush();
});

afterAll(() => orm.close(true));

test('findOne with fields naming an inline embeddable uses the identity map', async () => {
  const em = orm.em.fork();
  const mock = mockLogger(orm, ['query']);

  await em.findOneOrFail(Brand, 1, { fields: ['name'] });
  await em.findOneOrFail(Brand, 1, { fields: ['name'] });
  expect(mock).toHaveBeenCalledTimes(1);

  // `features` was not loaded yet, so this one has to query
  const brand = await em.findOneOrFail(Brand, 1, { fields: ['features'] });
  expect(mock).toHaveBeenCalledTimes(2);
  expect(brand.features.loyalty.tier).toBe('gold');

  await em.findOneOrFail(Brand, 1, { fields: ['features'] });
  expect(mock).toHaveBeenCalledTimes(2);
});

test('findOne with fields naming an inline embeddable path uses the identity map', async () => {
  const em = orm.em.fork();
  const mock = mockLogger(orm, ['query']);

  await em.findOneOrFail(Brand, 1, { fields: ['features.reviews'] });
  await em.findOneOrFail(Brand, 1, { fields: ['features.reviews'] });
  expect(mock).toHaveBeenCalledTimes(1);

  const brand = await em.findOneOrFail(Brand, 1, { fields: ['features.loyalty'] });
  expect(mock).toHaveBeenCalledTimes(2);
  expect(brand.features.loyalty.points).toBe(10);

  await em.findOneOrFail(Brand, 1, { fields: ['features.loyalty.tier'] });
  expect(mock).toHaveBeenCalledTimes(2);
});
