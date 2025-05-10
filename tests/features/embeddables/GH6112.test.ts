import { Embeddable, Embedded, Entity, EntityClass, MikroORM, Options, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Embeddable()
class Address {

  @Property()
  city!: string;

}


@Embeddable()
class Company {

  @Property()
  name!: string;

  @Embedded(() => Address, { prefix: 'addr_', prefixMode: 'relative' })
  address!: Address;

  @Embedded(() => Address, { prefix: 'addr2_' /* mode from configuration */ })
  address2!: Address;

}

@Entity()
class Person {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Address)
  address!: Address;

  @Embedded(() => Company, { prefix: 'comp_' })
  company!: Company;

}

describe('GH #6112', () => {
  let orm: MikroORM;

  afterEach(async () => {
    if (!orm) {
      return;
    }

    orm.em.clear();
    await orm.close();
  });

  async function loadORM(entity: EntityClass<any>, options: Options = {}) {
    // and get field names
    orm = await MikroORM.init({
      dbName: ':memory:',
      ...options,
      entities: [entity],
    });
    await orm.schema.createSchema();

    const meta = orm.getMetadata(entity);
    return {
      fieldNames: meta.comparableProps
        .map(({ name, fieldNames }) => [name, fieldNames[0]])
        .sort(([a], [b]) => a.localeCompare(b)),
      orm,
    };
  }

  it('should have the property prefixed with the one of its parent', async () => {
    const { fieldNames, orm } = await loadORM(Person, { embeddables: { prefixMode: 'absolute' } });
    expect(fieldNames).toStrictEqual([
      [ 'address', 'address' ],
      [ 'address_city', 'address_city' ],
      // mode: relative
      [ 'comp_address_city', 'comp_addr_city' ],
      // mode: absolute
      [ 'comp_address2_city', 'addr2_city' ],
      [ 'company', 'company' ],
      [ 'company_address', 'comp_address' ],
      [ 'company_address2', 'comp_address2' ],
      [ 'company_name', 'comp_name' ],
      [ 'id', 'id' ],
    ]);

    // To assure create & read
    const toCreate = {
      address: { city: 'city' },
      company: {
        address: { city: 'city-company' },
        address2: { city: 'city-company2' },
        name: 'company',
      },
    };

    orm.em.create(Person, toCreate);
    await orm.em.flush();

    const [person] = await orm.em.findAll(Person);
    expect(person).toMatchObject(toCreate);
  });

  it('should have the property prefixed with the one of its parent2', async () => {
    const { fieldNames, orm } = await loadORM(Person);
    expect(fieldNames).toStrictEqual([
      [ 'address', 'address' ],
      [ 'address_city', 'address_city' ],
      // mode: relative
      [ 'comp_address_city', 'comp_addr_city' ],
      // mode: relative (from configuration)
      [ 'comp_address2_city', 'comp_addr2_city' ],
      [ 'company', 'company' ],
      [ 'company_address', 'comp_address' ],
      [ 'company_address2', 'comp_address2' ],
      [ 'company_name', 'comp_name' ],
      [ 'id', 'id' ],
    ]);

    // To assure create & read
    const toCreate = {
      address: { city: 'city' },
      company: {
        address: { city: 'city-company' },
        address2: { city: 'city-company2' },
        name: 'company',
      },
    };

    orm.em.create(Person, toCreate);
    await orm.em.flush();

    const [person] = await orm.em.findAll(Person);
    expect(person).toMatchObject(toCreate);
  });

  it('should create the metadata without conflict', async () => {
    @Entity()
    class PersonWithAddr {

      @PrimaryKey()
      id!: number;

      // To not conflict with `company.address`
      @Embedded(() => Address)
      addr!: Address;

      @Embedded(() => Company)
      company!: Company;

    }

    const { fieldNames, orm } = await loadORM(PersonWithAddr, { embeddables: { prefixMode: 'absolute' } });
    expect(fieldNames).toStrictEqual([
      [ 'addr', 'addr' ],
      [ 'addr_city', 'addr_city' ],
      [ 'company', 'company' ],
      [ 'company_address', 'company_address' ],
      // mode: relative
      [ 'company_address_city', 'company_addr_city' ],
      [ 'company_address2', 'company_address2' ],
      // mode: absolute
      [ 'company_address2_city', 'addr2_city' ],
      [ 'company_name', 'company_name' ],
      [ 'id', 'id' ],
    ]);

    // To assure create & read
    const toCreate = {
      addr: { city: 'city' },
      company: {
        address: { city: 'city-company' },
        address2: { city: 'city-company2' },
        name: 'company',
      },
    };

    orm.em.create(PersonWithAddr, toCreate);
    await orm.em.flush();

    const [person] = await orm.em.findAll(PersonWithAddr);
    expect(person).toMatchObject(toCreate);
  });
});
