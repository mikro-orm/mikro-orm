import { assign, Embeddable, Embedded, Entity, expr, Logger, MikroORM, PrimaryKey, Property, ReferenceType, wrap } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Embeddable()
class Address1 {

  @Property()
  street?: string;

  @Property()
  number?: number;

  @Property()
  postalCode?: string;

  @Property()
  city?: string;

  @Property()
  country?: string;

  constructor(street?: string, number?: number, postalCode?: string, city?: string, country?: string) {
    this.street = street;
    this.number = number;
    this.postalCode = postalCode;
    this.city = city;
    this.country = country;
  }

}

@Embeddable()
class Address2 {

  @Property()
  street!: string;

  @Property()
  postalCode?: string;

  @Property()
  city!: string;

  @Property()
  country!: string;

  constructor(street: string, city: string, country: string, postalCode?: string) {
    this.street = street;
    this.city = city;
    this.country = country;
    this.postalCode = postalCode;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded()
  address1!: Address1;

  @Embedded({ prefix: 'addr_', nullable: true })
  address2?: Address2;

  @Embedded({ prefix: false })
  address3: Address1 = new Address1();

  @Embedded({ object: true })
  address4: Address1 = new Address1();

  @Embedded(() => Address1, { array: true })
  addresses: Address1[] = [];

  @Property({ nullable: true })
  after?: number; // property after embeddables to verify order props in resulting schema

}

describe('embedded entities in postgresql', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Address1, Address2, User],
      dbName: 'mikro_orm_test_embeddables',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('metadata', async () => {
    expect(orm.getMetadata().get('Address1').embeddable).toBe(true);
    expect(orm.getMetadata().get('Address1').properties).toMatchObject({
      street: { name: 'street', type: 'string' },
      postalCode: { name: 'postalCode', type: 'string' },
      city: { name: 'city', type: 'string' },
      country: { name: 'country', type: 'string' },
    });
    expect(orm.getMetadata().get('User').properties.address1).toMatchObject({
      name: 'address1',
      reference: ReferenceType.EMBEDDED,
      type: 'Address1',
    });
    expect(orm.getMetadata().get('User').properties.address1_street).toMatchObject({
      name: 'address1_street',
      reference: ReferenceType.SCALAR,
      type: 'string',
    });
    expect(orm.getMetadata().get('User').properties.address2).toMatchObject({
      name: 'address2',
      reference: ReferenceType.EMBEDDED,
      type: 'Address2',
    });
    expect(orm.getMetadata().get('User').properties.addr_street).toMatchObject({
      name: 'addr_street',
      reference: ReferenceType.SCALAR,
      type: 'string',
      nullable: true,
    });
    expect(orm.getMetadata().get('User').properties.address3).toMatchObject({
      name: 'address3',
      reference: ReferenceType.EMBEDDED,
      type: 'Address1',
    });
    expect(orm.getMetadata().get('User').properties.street).toMatchObject({
      name: 'street',
      reference: ReferenceType.SCALAR,
      type: 'string',
    });
  });

  test('schema', async () => {
    await expect(orm.getSchemaGenerator().getCreateSchemaSQL(false)).resolves.toMatchSnapshot('embeddables 1');
    await expect(orm.getSchemaGenerator().getUpdateSchemaSQL(false)).resolves.toMatchSnapshot('embeddables 2');
    await expect(orm.getSchemaGenerator().getDropSchemaSQL(false)).resolves.toMatchSnapshot('embeddables 3');
  });

  test('assigning to array embeddables (GH #1699)', async () => {
    const user = new User();
    expect(user.addresses).toEqual([]);
    const address1 = new Address1('Downing street 13A', 10, '10A', 'London 4A', 'UK 4A');
    const address2 = { street: 'Downing street 23A', number: 20, postalCode: '20A', city: 'London 24A', country: 'UK 24A' };

    wrap(user).assign({ addresses: [address1] }, { mergeObjects: true });
    expect(user.addresses).toEqual([address1]);
    expect(user.addresses[0]).toBeInstanceOf(Address1);

    wrap(user).assign({ addresses: [address1] }, { mergeObjects: true, updateNestedEntities: true });
    expect(user.addresses).toEqual([address1]);
    expect(user.addresses[0]).toBeInstanceOf(Address1);

    wrap(user).assign({ addresses: [address2] });
    expect(user.addresses).toEqual([address2]);
    expect(user.addresses[0]).toBeInstanceOf(Address1);

    wrap(user).assign({ addresses: address1 }); // push to existing array
    expect(user.addresses).toEqual([address2, address1]);
    expect(user.addresses[0]).toBeInstanceOf(Address1);
    expect(user.addresses[1]).toBeInstanceOf(Address1);
    expect(user.addresses).toHaveLength(2);
  });

  test('persist and load', async () => {
    const user = new User();
    user.address1 = new Address1('Downing street 10', 10, '123', 'London 1', 'UK 1');
    user.address2 = new Address2('Downing street 11', 'London 2', 'UK 2');
    user.address3 = new Address1('Downing street 12', 10, '789', 'London 3', 'UK 3');
    user.address4 = new Address1('Downing street 13', 10, '10', 'London 4', 'UK 4');
    user.addresses.push(new Address1('Downing street 13A', 10, '10A', 'London 4A', 'UK 4A'));
    user.addresses.push(new Address1('Downing street 13B', 10, '10B', 'London 4B', 'UK 4B'));

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });
    await orm.em.persistAndFlush(user);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into "user" ("addr_city", "addr_country", "addr_postal_code", "addr_street", "address1_city", "address1_country", "address1_number", "address1_postal_code", "address1_street", "address4", "addresses", "city", "country", "number", "postal_code", "street") values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) returning "id"');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    const u = await orm.em.findOneOrFail(User, user.id);
    expect(mock.mock.calls[3][0]).toMatch('select "e0".* from "user" as "e0" where "e0"."id" = $1 limit $2');
    expect(u.address1).toBeInstanceOf(Address1);
    expect(u.address1).toEqual({
      street: 'Downing street 10',
      number: 10,
      postalCode: '123',
      city: 'London 1',
      country: 'UK 1',
    });
    expect(u.address2).toBeInstanceOf(Address2);
    expect(u.address2).toEqual({
      street: 'Downing street 11',
      postalCode: null,
      city: 'London 2',
      country: 'UK 2',
    });
    expect(u.address3).toBeInstanceOf(Address1);
    expect(u.address3).toEqual({
      street: 'Downing street 12',
      number: 10,
      postalCode: '789',
      city: 'London 3',
      country: 'UK 3',
    });
    expect(u.address4).toBeInstanceOf(Address1);
    expect(u.address4).toEqual({
      street: 'Downing street 13',
      number: 10,
      postalCode: '10',
      city: 'London 4',
      country: 'UK 4',
    });

    u.address2!.postalCode = '111';
    u.address4!.postalCode = '999';
    await orm.em.flush();
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('update "user" set "addr_postal_code" = $1, "address4" = $2 where "id" = $3');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    orm.em.clear();

    const u1 = await orm.em.findOneOrFail(User, { address1: { city: 'London 1', postalCode: '123' } });
    expect(mock.mock.calls[7][0]).toMatch('select "e0".* from "user" as "e0" where "e0"."address1_city" = $1 and "e0"."address1_postal_code" = $2 limit $3');
    expect(u1.address1.city).toBe('London 1');
    expect(u1.address1.postalCode).toBe('123');
    const u2 = await orm.em.findOneOrFail(User, { address1: { city: /^London/ } });
    expect(mock.mock.calls[8][0]).toMatch('select "e0".* from "user" as "e0" where "e0"."address1_city" like $1 limit $2');
    expect(u2.address1.city).toBe('London 1');
    expect(u2.address1.postalCode).toBe('123');
    expect(u2).toBe(u1);
    const u3 = await orm.em.findOneOrFail(User, { $or: [{ address1: { city: 'London 1' } }, { address1: { city: 'Berlin' } }] });
    expect(mock.mock.calls[9][0]).toMatch('select "e0".* from "user" as "e0" where ("e0"."address1_city" = $1 or "e0"."address1_city" = $2) limit $3');
    expect(u3.address1.city).toBe('London 1');
    expect(u3.address1.postalCode).toBe('123');
    expect(u3).toBe(u1);
    const err = "Using operators inside embeddables is not allowed, move the operator above. (property: User.address1, payload: { address1: { '$or': [ [Object], [Object] ] } })";
    await expect(orm.em.findOneOrFail(User, { address1: { $or: [{ city: 'London 1' }, { city: 'Berlin' }] } })).rejects.toThrowError(err);
    const u4 = await orm.em.findOneOrFail(User, { address4: { postalCode: '999' } });
    expect(u4).toBe(u1);
    expect(mock.mock.calls[10][0]).toMatch('select "e0".* from "user" as "e0" where "e0"."address4"->>\'postalCode\' = $1 limit $2');

    const u5 = await orm.em.findOneOrFail(User, { address4: { number: { $gt: 2 } } });
    expect(u5).toBe(u1);
    expect(mock.mock.calls[11][0]).toMatch('select "e0".* from "user" as "e0" where ("e0"."address4"->>\'number\')::float8 > $1 limit $2');
  });

  test('assign', async () => {
    const user = new User();
    wrap(user).assign({
      address1: { street: 'Downing street 10', postalCode: '123', city: 'London 1', country: 'UK 1' },
      address2: { street: 'Downing street 11', city: 'London 2', country: 'UK 2' },
      address3: { street: 'Downing street 12', postalCode: '789', city: 'London 3', country: 'UK 3' },
    }, { em: orm.em });
    assign(user, { address4: { city: '41', country: '42', postalCode: '43', street: '44' } });
    expect(user.address4).toMatchObject({ city: '41', country: '42', postalCode: '43', street: '44' });

    expect(user.address1).toBeInstanceOf(Address1);
    expect(user.address1).toEqual({
      street: 'Downing street 10',
      postalCode: '123',
      city: 'London 1',
      country: 'UK 1',
    });
    expect(user.address2).toBeInstanceOf(Address2);
    expect(user.address2).toEqual({
      street: 'Downing street 11',
      city: 'London 2',
      country: 'UK 2',
    });
    expect(user.address3).toBeInstanceOf(Address1);
    expect(user.address3).toEqual({
      street: 'Downing street 12',
      postalCode: '789',
      city: 'London 3',
      country: 'UK 3',
    });
  });


  test('native update entity', async () => {
    const user = new User();
    wrap(user).assign({
      address1: { street: 'Downing street 10', number: 3, postalCode: '123', city: 'London 1', country: 'UK 1' },
      address2: { street: 'Downing street 11', number: 3, city: 'London 2', country: 'UK 2' },
      address3: { street: 'Downing street 12', number: 3, postalCode: '789', city: 'London 3', country: 'UK 3' },
      address4: { street: 'Downing street 10', number: 3, postalCode: '123', city: 'London 1', country: 'UK 1' },
    }, { em: orm.em });

    await orm.em.persistAndFlush(user);

    await orm.em.nativeUpdate(User, {
      address4: {
        number: {
          $gt: 2,
        },
      },
    }, {
      after: 2,
    });
    orm.em.clear();

    const userAfterUpdate = await orm.em.findOne(User, user.id);
    expect(userAfterUpdate?.after).toBe(2);
  });

  test('query by complex custom expressions with JSON operator and casting (GH issue 1261)', async () => {
    const user = new User();
    user.address1 = new Address1('Test', 10, '12000', 'Prague', 'CZ');
    user.address3 = new Address1('Test', 10, '12000', 'Prague', 'CZ');
    user.address4 = new Address1('Test', 10, '12000', 'Prague', 'CZ');
    await orm.em.persistAndFlush(user);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    const r = await orm.em.find(User, {
      [expr('(address4->>\'street\')::text != \'\'')]: [],
      [expr('lower((address4->>\'city\')::text) = ?')]: ['prague'],
      [expr('(address4->>?)::text = ?')]: ['city', 'Prague'],
      [expr('(address4->>?)::text')]: ['postalCode', '12000'],
    });
    expect(r[0]).toBeInstanceOf(User);
    expect(r[0].address4).toBeInstanceOf(Address1);
    expect(r[0].address4.city).toBe('Prague');
    expect(r[0].address4.postalCode).toBe('12000');
    expect(mock.mock.calls[0][0]).toMatch('select "e0".* ' +
      'from "user" as "e0" ' +
      'where (address4->>\'street\')::text != \'\' and ' +
      'lower((address4->>\'city\')::text) = \'prague\' and ' +
      '(address4->>\'city\')::text = \'Prague\' and ' +
      '(address4->>\'postalCode\')::text = \'12000\'');
  });

});
