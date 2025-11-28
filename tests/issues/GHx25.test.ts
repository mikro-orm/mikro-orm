import { MikroORM, PopulateHint, Ref } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Location {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Country, ref: true })
  country!: Ref<Country>;

}

@Entity()
class Country {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Continent, ref: true })
  continent!: Ref<Continent>;

}

@Entity()
class Continent {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Region, ref: true })
  region!: Ref<Region>;

  @Property()
  slug!: string;

}

@Entity()
class Region {

  @PrimaryKey()
  id!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Location, Country, Continent, Region],
    populateWhere: PopulateHint.INFER,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('should return invoices without a recharge task', async () => {
  orm.em.create(Location, {
    country: { continent: { region: {}, slug: 'europe' } },
  });
  await orm.em.flush();
  orm.em.clear();

  const allLocations = await orm.em.find(
    Location,
    {
      country: { continent: { slug: 'europe' } },
    },
    {
      populate: ['country.continent.region'],
    },
  );

  expect(allLocations).toHaveLength(1);
});
