import {
  Embeddable,
  Embedded,
  Entity,
  raw,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  PrimaryKey,
  Property,
  ReferenceKind,
  Rel,
  t,
} from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

@Embeddable()
class Address1 {

  @Property({ nullable: true })
  street?: string;

  @Property({ type: 'double' })
  number?: number;

  @Property({ type: t.float, nullable: true })
  rank?: number;

  @Property({ nullable: true })
  postalCode?: string;

  @Property({ nullable: true })
  city?: string;

  @Property({ nullable: true })
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
class Foo {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: Rel<User>;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  email!: string;

  @Embedded()
  address1!: Address1;

  @Embedded(() => Address2, { prefix: 'addr_', nullable: true })
  address2?: Address2;

  @Embedded({ prefix: false })
  address3: Address1 = new Address1();

  @Embedded({ object: true })
  address4: Address1 = new Address1();

  @Embedded(() => Address1, { array: true, nullable: true })
  addresses: Address1[] | null = [];

  @Property({ nullable: true })
  after?: number; // property after embeddables to verify order props in resulting schema

}

describe('embedded entities in postgresql', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Foo],
      dbName: 'mikro_orm_test_embeddables',
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(() => orm.schema.clearDatabase());
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
      kind: ReferenceKind.EMBEDDED,
      type: 'Address1',
    });
    expect(orm.getMetadata().get('User').properties.address1_street).toMatchObject({
      name: 'address1_street',
      kind: ReferenceKind.SCALAR,
      type: 'string',
    });
    expect(orm.getMetadata().get('User').properties.address2).toMatchObject({
      name: 'address2',
      kind: ReferenceKind.EMBEDDED,
      type: 'Address2',
    });
    expect(orm.getMetadata().get('User').properties.address2_street).toMatchObject({
      name: 'address2_street',
      kind: ReferenceKind.SCALAR,
      type: 'string',
      nullable: true,
    });
    expect(orm.getMetadata().get('User').properties.address3).toMatchObject({
      name: 'address3',
      kind: ReferenceKind.EMBEDDED,
      type: 'Address1',
    });
    expect(orm.getMetadata().get('User').properties['address4~street']).toMatchObject({
      name: 'address4~street',
      kind: ReferenceKind.SCALAR,
      type: 'string',
    });
  });

  test('schema', async () => {
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('embeddables 1');
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('embeddables 2');
    await expect(orm.schema.getDropSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('embeddables 3');
  });

  test('assigning to array embeddables (GH #1699)', async () => {
    const user = new User();
    user.email = 'test';
    expect(user.addresses).toEqual([]);
    const address1 = new Address1('Downing street 13A', 10, '10A', 'London 4A', 'UK 4A');
    const address2 = {
      street: 'Downing street 23A',
      number: 20,
      postalCode: '20A',
      city: 'London 24A',
      country: 'UK 24A',
    };

    orm.em.assign(user, { addresses: [address1] });
    expect(user.addresses).toEqual([address1]);
    expect(user.addresses![0]).toBeInstanceOf(Address1);

    orm.em.assign(user, { addresses: [address1] });
    expect(user.addresses).toEqual([address1]);
    expect(user.addresses![0]).toBeInstanceOf(Address1);

    orm.em.assign(user, { addresses: [address2] });
    expect(user.addresses).toEqual([address2]);
    expect(user.addresses![0]).toBeInstanceOf(Address1);

    orm.em.assign(user, { addresses: address1 }); // push to existing array
    expect(user.addresses).toEqual([address2, address1]);
    expect(user.addresses![0]).toBeInstanceOf(Address1);
    expect(user.addresses![1]).toBeInstanceOf(Address1);
    expect(user.addresses).toHaveLength(2);
  });

  function createUser() {
    return orm.em.create(User, {
      email: `test-${Math.random()}`,
      address1: { street: 'Downing street 10', number: 10, postalCode: '123', city: 'London 1', country: 'UK 1' },
      address2: { street: 'Downing street 11', city: 'London 2', country: 'UK 2' },
      address3: { street: 'Downing street 12', number: 10, postalCode: '789', city: 'London 3', country: 'UK 3' },
      address4: { street: 'Downing street 13', number: 10, postalCode: '10', city: 'London 4', country: 'UK 4' },
      addresses: [
        { street: 'Downing street 13A', number: 10, postalCode: '10A', city: 'London 4A', country: 'UK 4A' },
        { street: 'Downing street 13B', number: 10, postalCode: '10B', city: 'London 4B', country: 'UK 4B' },
      ],
    });
  }

  test('persist and load', async () => {
    const mock = mockLogger(orm, ['query']);
    const user = createUser();
    await orm.em.persistAndFlush(user);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into "user" ("email", "address1_street", "address1_number", "address1_postal_code", "address1_city", "address1_country", "addr_street", "addr_city", "addr_country", "street", "number", "postal_code", "city", "country", "address4", "addresses") values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) returning "id"');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    const u = await orm.em.findOneOrFail(User, user.id);
    expect(mock.mock.calls[3][0]).toMatch('select "u0".* from "user" as "u0" where "u0"."id" = $1 limit $2');
    expect(u.address1).toBeInstanceOf(Address1);
    expect(u.address1).toEqual({
      street: 'Downing street 10',
      number: 10,
      rank: null,
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
      rank: null,
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
    expect(mock.mock.calls[7][0]).toMatch('select "u0".* from "user" as "u0" where "u0"."address1_city" = $1 and "u0"."address1_postal_code" = $2 limit $3');
    expect(u1.address1.city).toBe('London 1');
    expect(u1.address1.postalCode).toBe('123');
    const u2 = await orm.em.findOneOrFail(User, { address1: { city: /^London/ } });
    expect(mock.mock.calls[8][0]).toMatch('select "u0".* from "user" as "u0" where "u0"."address1_city" like $1 limit $2');
    expect(u2.address1.city).toBe('London 1');
    expect(u2.address1.postalCode).toBe('123');
    expect(u2).toBe(u1);
    const u3 = await orm.em.findOneOrFail(User, { $or: [{ address1: { city: 'London 1' } }, { address1: { city: 'Berlin' } }] });
    expect(mock.mock.calls[9][0]).toMatch('select "u0".* from "user" as "u0" where ("u0"."address1_city" = $1 or "u0"."address1_city" = $2) limit $3');
    expect(u3.address1.city).toBe('London 1');
    expect(u3.address1.postalCode).toBe('123');
    expect(u3).toBe(u1);
    const err = 'Using operators inside embeddables is not allowed, move the operator above. (property: User.address1, payload: { address1: { \'$or\': [ [Object], [Object] ] } })';
    await expect(orm.em.findOneOrFail(User, { address1: { $or: [{ city: 'London 1' }, { city: 'Berlin' }] } })).rejects.toThrow(err);
    const u4 = await orm.em.findOneOrFail(User, { address4: { postalCode: '999' } });
    expect(u4).toBe(u1);
    expect(mock.mock.calls[10][0]).toMatch('select "u0".* from "user" as "u0" where "u0"."address4"->>\'postal_code\' = $1 limit $2');

    const u5 = await orm.em.findOneOrFail(User, { address4: { number: { $gt: 2 } } });
    expect(u5).toBe(u1);
    expect(mock.mock.calls[11][0]).toMatch('select "u0".* from "user" as "u0" where ("u0"."address4"->>\'number\')::float8 > $1 limit $2');
  });

  test('findAndCount with embedded query', async () => {
    const user = createUser();
    await orm.em.persistAndFlush(user);
    orm.em.clear();

    const address1 = orm.em.create(Address1, { street: 'Downing street 10', number: 10, postalCode: '123', city: 'London 1', country: 'UK 1' });
    const [r, t] = await orm.em.fork().findAndCount(User, { address1 });
    expect(r).toHaveLength(1);
    expect(t).toBe(1);
  });

  test('partial loading', async () => {
    const user = createUser();
    await orm.em.persistAndFlush(user);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    await orm.em.fork().find(User, {}, { fields: ['address2'] });
    // @ts-expect-error old syntax is still technically supported, but not on type level
    await orm.em.fork().find(User, {}, { fields: [{ address2: ['street', 'city'] }] });
    await orm.em.fork().find(User, {}, { fields: ['address2.street', 'address2.city'] });
    await orm.em.fork().find(User, {}, { fields: ['addresses'] });
    expect(mock.mock.calls[0][0]).toMatch('select "u0"."id", "u0"."addr_street", "u0"."addr_postal_code", "u0"."addr_city", "u0"."addr_country" from "user" as "u0"');
    expect(mock.mock.calls[1][0]).toMatch('select "u0"."id", "u0"."addr_street", "u0"."addr_city" from "user" as "u0"');
    expect(mock.mock.calls[2][0]).toMatch('select "u0"."id", "u0"."addr_street", "u0"."addr_city" from "user" as "u0"');
    expect(mock.mock.calls[3][0]).toMatch('select "u0"."id", "u0"."addresses" from "user" as "u0"');
  });

  test('partial loading (joined strategy)', async () => {
    const user = createUser();
    await orm.em.persistAndFlush(user);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    await orm.em.fork().find(User, {}, { fields: ['address2'], strategy: LoadStrategy.JOINED });
    // @ts-expect-error old syntax is still technically supported, but not on type level
    await orm.em.fork().find(User, {}, { fields: [{ address2: ['street', 'city'] }], strategy: LoadStrategy.JOINED });
    await orm.em.fork().find(User, {}, { fields: ['address2.street', 'address2.city'], strategy: LoadStrategy.JOINED });
    await orm.em.fork().find(User, {}, { fields: ['addresses'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls[0][0]).toMatch('select "u0"."id", "u0"."addr_street", "u0"."addr_postal_code", "u0"."addr_city", "u0"."addr_country" from "user" as "u0"');
    expect(mock.mock.calls[1][0]).toMatch('select "u0"."id", "u0"."addr_street", "u0"."addr_city" from "user" as "u0"');
    expect(mock.mock.calls[2][0]).toMatch('select "u0"."id", "u0"."addr_street", "u0"."addr_city" from "user" as "u0"');
    expect(mock.mock.calls[3][0]).toMatch('select "u0"."id", "u0"."addresses" from "user" as "u0"');
  });

  test('partial loading 2', async () => {
    const mock = mockLogger(orm, ['query']);

    await orm.em.fork().qb(User).select('address1.city').where({ address1: { city: 'London 1' } }).execute();
    expect(mock.mock.calls[0][0]).toMatch('select "u0"."address1_city" from "user" as "u0" where "u0"."address1_city" = $1');

    await orm.em.fork().findOne(User, { address1: { city: 'London 1' } }, { fields: ['address1.city'] });
    expect(mock.mock.calls[1][0]).toMatch('select "u0"."id", "u0"."address1_city" from "user" as "u0" where "u0"."address1_city" = $1 limit $2');

    await orm.em.fork().qb(User).select('address1').where({ address1: { city: 'London 1' } }).execute();
    expect(mock.mock.calls[2][0]).toMatch('select "u0"."address1_street", "u0"."address1_number", "u0"."address1_rank", "u0"."address1_postal_code", "u0"."address1_city", "u0"."address1_country" from "user" as "u0" where "u0"."address1_city" = $1');

    await orm.em.fork().findOne(User, { address1: { city: 'London 1' } }, { fields: ['address1'] });
    expect(mock.mock.calls[3][0]).toMatch('select "u0"."id", "u0"."address1_street", "u0"."address1_number", "u0"."address1_rank", "u0"."address1_postal_code", "u0"."address1_city", "u0"."address1_country" from "user" as "u0" where "u0"."address1_city" = $1 limit $2');

    mock.mockReset();

    await orm.em.fork().qb(User).select('address4.city').where({ address4: { city: 'London 1' } }).execute(); // object embedded prop does not support nested partial loading
    expect(mock.mock.calls[0][0]).toMatch(`select "u0"."address4" from "user" as "u0" where "u0"."address4"->>'city' = $1`);

    await orm.em.fork().findOne(User, { address4: { city: 'London 1' } }, { fields: ['address4.city'] }); // object embedded prop does not support nested partial loading
    expect(mock.mock.calls[1][0]).toMatch(`select "u0"."id", "u0"."address4" from "user" as "u0" where "u0"."address4"->>'city' = $1 limit $2`);

    await orm.em.fork().qb(User).select('address4').where({ address4: { city: 'London 1' } }).execute();
    expect(mock.mock.calls[2][0]).toMatch(`select "u0"."address4" from "user" as "u0" where "u0"."address4"->>'city' = $1`);

    await orm.em.fork().findOne(User, { address4: { city: 'London 1' } }, { fields: ['address4'] });
    expect(mock.mock.calls[3][0]).toMatch(`select "u0"."id", "u0"."address4" from "user" as "u0" where "u0"."address4"->>'city' = $1 limit $2`);

    mock.mockReset();

    await orm.em.fork().qb(User).select('addresses.city').where({ addresses: { city: 'London 1' } }).execute(); // object embedded prop does not support nested partial loading
    expect(mock.mock.calls[0][0]).toMatch(`select "u0"."addresses" from "user" as "u0" where "u0"."addresses"->>'city' = $1`);

    await orm.em.fork().findOne(User, { addresses: { city: 'London 1' } }, { fields: ['addresses.city'] }); // object embedded prop does not support nested partial loading
    expect(mock.mock.calls[1][0]).toMatch(`select "u0"."id", "u0"."addresses" from "user" as "u0" where "u0"."addresses"->>'city' = $1 limit $2`);

    await orm.em.fork().qb(User).select('addresses').where({ addresses: { city: 'London 1' } }).execute();
    expect(mock.mock.calls[2][0]).toMatch(`select "u0"."addresses" from "user" as "u0" where "u0"."addresses"->>'city' = $1`);

    await orm.em.fork().findOne(User, { addresses: { city: 'London 1' } }, { fields: ['addresses'] });
    expect(mock.mock.calls[3][0]).toMatch(`select "u0"."id", "u0"."addresses" from "user" as "u0" where "u0"."addresses"->>'city' = $1 limit $2`);

    const user = createUser();
    await orm.em.fork().qb(User).insert(user).onConflict(['email']).merge(['email', 'address1.city']);
    expect(mock.mock.calls[4][0]).toMatch(`insert into "user" ("email", "address1_street", "address1_number", "address1_postal_code", "address1_city", "address1_country", "addr_street", "addr_city", "addr_country", "street", "number", "postal_code", "city", "country", "address4", "addresses") values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) on conflict ("email") do update set "email" = excluded."email", "address1_city" = excluded."address1_city" returning "id"`);
  });

  test('assign', async () => {
    const user = new User();
    user.email = `test-${Math.random()}`;
    orm.em.assign(user, {
      address1: { street: 'Downing street 10', postalCode: '123', city: 'London 1', country: 'UK 1' },
      address2: { street: 'Downing street 11', city: 'London 2', country: 'UK 2' },
      address3: { street: 'Downing street 12', postalCode: '789', city: 'London 3', country: 'UK 3' },
    }, { em: orm.em });
    orm.em.assign(user, { address4: { city: '41', country: '42', postalCode: '43', street: '44' } });
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
    orm.em.assign(user, {
      email: 'test',
      address1: { street: 'Downing street 10', number: 3, postalCode: '123', city: 'London 1', country: 'UK 1' },
      address2: { street: 'Downing street 11', city: 'London 2', country: 'UK 2' },
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

  test('GH #4711', async () => {
    const user = new User();
    user.email = `test-${Math.random()}`;
    user.address1 = new Address1('Test 1', 10, '12000', 'Prague', 'CZ');
    user.address3 = new Address1('Test 3', 10, '12000', 'Prague', 'CZ');
    user.address4 = new Address1('Test 4', 10, '12000', 'Prague', 'CZ');
    const foo = new Foo();
    foo.user = user;
    await orm.em.fork().persistAndFlush(foo);

    const query = orm.em.qb(Foo, 'f')
      .leftJoin('f.user', 'u')
      .select(['f.*', 'u.street']);
    expect(query.getQuery()).toBe('select "f".*, "u"."street" from "foo" as "f" left join "user" as "u" on "f"."user_id" = "u"."id"');
    await expect(query).resolves.toEqual([
      {
        id: 1,
        user: { id: 1 },
      },
    ]);
  });

  test('query by complex custom expressions with JSON operator and casting (GH issue 1261)', async () => {
    const user = new User();
    user.email = `test-${Math.random()}`;
    user.address1 = new Address1('Test', 10, '12000', 'Prague', 'CZ');
    user.address3 = new Address1('Test', 10, '12000', 'Prague', 'CZ');
    user.address4 = new Address1('Test', 10, '12000', 'Prague', 'CZ');
    await orm.em.persistAndFlush(user);
    orm.em.clear();

    const mock = mockLogger(orm);

    const r = await orm.em.find(User, {
      [raw('(address4->>\'street\')::text != \'\'')]: [],
      [raw('lower((address4->>\'city\')::text) = ?', ['prague'])]: [],
      [raw('(address4->>?)::text = ?', ['city', 'Prague'])]: [],
      [raw('(address4->>?)::text', ['postal_code'])]: '12000',
    });
    expect(r[0]).toBeInstanceOf(User);
    expect(r[0].address4).toBeInstanceOf(Address1);
    expect(r[0].address4.city).toBe('Prague');
    expect(r[0].address4.postalCode).toBe('12000');
    expect(mock.mock.calls[0][0]).toMatch('select "u0".* ' +
      'from "user" as "u0" ' +
      'where (address4->>\'street\')::text != \'\' and ' +
      'lower((address4->>\'city\')::text) = \'prague\' and ' +
      '(address4->>\'city\')::text = \'Prague\' and ' +
      '(address4->>\'postal_code\')::text = \'12000\'');
  });

  test('array operators', async () => {
    createUser();
    const qb = orm.em.createQueryBuilder(User).select('*').where({
      addresses: { $contains: [{ street: 'Downing street 13A' }] },
    });
    expect(qb.getFormattedQuery()).toBe(`select "u0".* from "user" as "u0" where "u0"."addresses" @> '[{"street":"Downing street 13A"}]'`);
    const res = await qb;
    expect(res[0].addresses).toEqual([
      {
        street: 'Downing street 13A',
        number: 10,
        postalCode: '10A',
        city: 'London 4A',
        country: 'UK 4A',
      },
      {
        street: 'Downing street 13B',
        number: 10,
        postalCode: '10B',
        city: 'London 4B',
        country: 'UK 4B',
      },
    ]);
  });

  test('nullable array property', async () => {
    const user1 = createUser();
    const user2 = createUser();
    user1.addresses = null;
    await orm.em.flush();
    expect(user1.addresses).toBeNull();
    expect(user2.addresses).toHaveLength(2);
  });

});
