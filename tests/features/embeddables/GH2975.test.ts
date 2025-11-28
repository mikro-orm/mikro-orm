import { MikroORM, t } from '@mikro-orm/sqlite';

import { Embeddable, Embedded, Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Country {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @Property()
  countryName!: string;

  constructor(countryName: string) {
    this.countryName = countryName;
  }

}

@Embeddable()
class Address {

  @Property()
  streetName!: string;

  @ManyToOne({ entity: () => Country, eager: true })
  country: Country;

  constructor(streetName: string, country: Country) {
    this.streetName = streetName;
    this.country = country;
  }

}

@Entity()
class Provider {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @Property()
  name!: string;

  @Embedded({ entity: () => Address })
  address: Address;

  constructor(name: string, address: Address) {
    this.name = name;
    this.address = address;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Provider],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 2975`, async () => {
  const provider = new Provider(
    'Coffee provider',
    new Address(
      'Sesame St.',
      new Country('Atlantida'),
    ),
  );
  await orm.em.fork().persist(provider).flush();

  const loadedProvider = await orm.em.findOneOrFail(Provider, { name: 'Coffee provider' });
  expect(loadedProvider.address.country.countryName).toBe('Atlantida');
});
