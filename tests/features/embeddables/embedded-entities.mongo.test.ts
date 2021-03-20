import { assign, Embeddable, Embedded, Entity, EntitySchema, Logger, MikroORM, Platform, PrimaryKey, Property, ReferenceType, SerializedPrimaryKey, Type } from '@mikro-orm/core';
import { ObjectId, MongoDriver, MongoConnection, MongoPlatform } from '@mikro-orm/mongodb';

@Embeddable()
class Address1Base {

  @Property()
  street?: string;

  @Property()
  postalCode?: string;

  constructor(street?: string, postalCode?: string) {
    this.street = street;
    this.postalCode = postalCode;
  }

}

@Embeddable()
class Address1 extends Address1Base {

  @Property()
  city?: string;

  @Property()
  country?: string;

  constructor(street?: string, postalCode?: string, city?: string, country?: string) {
    super(street, postalCode);
    this.city = city;
    this.country = country;
  }

}

@Embeddable()
class Address2Base {

  @Property()
  street!: string;

  @Property()
  postalCode?: string;

  constructor(street: string, postalCode?: string) {
    this.street = street;
    this.postalCode = postalCode;
  }

}

@Embeddable()
class Address2 extends Address2Base {

  @Property()
  city!: string;

  @Property()
  country!: string;

  constructor(street: string, city: string, country: string, postalCode?: string) {
    super(street, postalCode);
    this.city = city;
    this.country = country;
  }

}

@Entity()
class User {

  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Embedded(() => Address1)
  address1!: Address1;

  @Embedded({ entity: () => Address2, prefix: 'addr_', nullable: true })
  address2?: Address2;

  @Embedded({ entity: () => Address1, prefix: false })
  address3 = new Address1();

  @Embedded({ entity: () => Address1, object: true })
  address4 = new Address1();

  @Embedded({ entity: () => Address1, object: true, nullable: true })
  address5?: Address1;

}

class NumericType extends Type<number, string> {

  convertToDatabaseValue(value: number, platform: Platform): string {
    this.validatePlatformSupport(platform);
    return value.toString();
  }

  convertToJSValue(value: string, platform: Platform): number {
    this.validatePlatformSupport(platform);
    return Number(value);
  }

  getColumnType(): string {
    return 'double';
  }

  private validatePlatformSupport(platform: Platform): void {
    if (!(platform instanceof MongoPlatform)) {
      throw new Error('Numeric custom type implemented only for Mongo.');
    }
  }

}

@Embeddable()
class CustomAddress {

  @Property()
  street!: string;

  @Property({ type: NumericType })
  postalCode!: number;

  constructor(street?: string, code?: number) {
    if (street !== undefined) { this.street = street; }
    if (code !== undefined) { this.postalCode = code; }
  }

}

@Entity()
class CustomUser {

  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Embedded()
  address!: CustomAddress;

}

class Parent {

  _id!: number;
  foo!: number;
  child!: Child;

}

class Child {

  bar!: number;

}

const parentSchema = new EntitySchema({
  class: Parent,
  properties: {
    _id: { primary: true, type: 'number' },
    foo: { type: 'number' },
    child: { type: 'Child', reference: 'embedded' },
  },
});

const childSchema = new EntitySchema({
  class: Child,
  embeddable: true,
  properties: {
    bar: { type: 'number' },
  },
});

describe('embedded entities in mongo', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Address1Base, Address1, Address2Base, Address2, User, CustomAddress, CustomUser, childSchema, parentSchema],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test-embeddables?replicaSet=rs0',
      type: 'mongo',
      validate: true,
    });
  });

  afterAll(async () => {
    await orm.em.getDriver().dropCollections();
    await orm.close(true);
  });

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

  test('create collections', async () => {
    const createCollection = jest.spyOn(MongoConnection.prototype, 'createCollection');
    createCollection.mockResolvedValue({} as any);
    await orm.em.getDriver().createCollections();
    expect(createCollection.mock.calls.map(c => c[0])).toEqual(['user', 'custom-user', 'parent']);
    createCollection.mockRestore();
  });

  test('persist and load', async () => {
    const user = new User();
    user.address1 = new Address1('Downing street 10', '123', 'London 1', 'UK 1');
    user.address2 = new Address2('Downing street 11', 'London 2', 'UK 2');
    user.address3 = new Address1('Downing street 12', '789', 'London 3', 'UK 3');
    user.address4 = new Address1('Downing street 13', '10', 'London 4', 'UK 4');

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    await orm.em.persistAndFlush(user);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('user').insertOne({ address1_street: 'Downing street 10', address1_postalCode: '123', address1_city: 'London 1', address1_country: 'UK 1', addr_street: 'Downing street 11', addr_postalCode: undefined, addr_city: 'London 2', addr_country: 'UK 2', street: 'Downing street 12', postalCode: '789', city: 'London 3', country: 'UK 3', address4: { street: 'Downing street 13', postalCode: '10', city: 'London 4', country: 'UK 4' } }, { session: undefined });`);

    const u = await orm.em.findOneOrFail(User, user.id);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('user'\)\.find\({ _id: .* }, { session: undefined }\)\.limit\(1\).toArray\(\);/);
    expect(u.address1).toBeInstanceOf(Address1);
    expect(u.address1).toEqual({
      street: 'Downing street 10',
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
      postalCode: '789',
      city: 'London 3',
      country: 'UK 3',
    });
    expect(u.address4).toBeInstanceOf(Address1);
    expect(u.address4).toEqual({
      street: 'Downing street 13',
      postalCode: '10',
      city: 'London 4',
      country: 'UK 4',
    });

    u.address2!.postalCode = '111';
    u.address4!.postalCode = '999';
    await orm.em.flush();
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('user'\)\.updateMany\({ _id: .* }, { '\$set': { addr_postalCode: '111', address4: { street: 'Downing street 13', postalCode: '999', city: 'London 4', country: 'UK 4' } } }, { session: undefined }\);/);
    orm.em.clear();

    const u1 = await orm.em.findOneOrFail(User, { address1: { city: 'London 1', postalCode: '123' } });
    expect(mock.mock.calls[3][0]).toMatch(/db\.getCollection\('user'\)\.find\({ address1_city: 'London 1', address1_postalCode: '123' }, { session: undefined }\)\.limit\(1\).toArray\(\);/);
    expect(u1.address1.city).toBe('London 1');
    expect(u1.address1.postalCode).toBe('123');
    const u2 = await orm.em.findOneOrFail(User, { address1: { city: /^London/ } });
    expect(mock.mock.calls[4][0]).toMatch(/db\.getCollection\('user'\)\.find\({ address1_city: \/\^London\/ }, { session: undefined }\)\.limit\(1\).toArray\(\);/);
    expect(u2.address1.city).toBe('London 1');
    expect(u2.address1.postalCode).toBe('123');
    expect(u2).toBe(u1);
    const u3 = await orm.em.findOneOrFail(User, { $or: [{ address1: { city: 'London 1' } }, { address1: { city: 'Berlin' } }] });
    expect(mock.mock.calls[5][0]).toMatch(/db\.getCollection\('user'\)\.find\({ '\$or': \[ { address1_city: 'London 1' }, { address1_city: 'Berlin' } ] }, { session: undefined }\)\.limit\(1\).toArray\(\);/);
    expect(u3).toBe(u1);
    const err = `Using operators inside embeddables is not allowed, move the operator above. (property: User.address1, payload: { address1: { '$or': [ [Object], [Object] ] } })`;
    await expect(orm.em.findOneOrFail(User, { address1: { $or: [{ city: 'London 1' }, { city: 'Berlin' }] } })).rejects.toThrowError(err);
    const u4 = await orm.em.findOneOrFail(User, { address4: { postalCode: '999' } });
    expect(u4).toBe(u1);
  });

  test('validation of object embeddables (GH issue #466)', async () => {
    const user = new User();
    user.address4.postalCode = 123 as any;
    await expect(orm.em.persistAndFlush(user)).rejects.toThrowError(`Trying to set User.address4_postalCode of type 'string' to '123' of type 'number'`);
  });

  test('#assign() works with embeddables', async () => {
    const jon = new User();
    assign(jon, { address1: { city: '1', country: '2', postalCode: '3', street: '4' } });
    expect(jon.address1).toMatchObject({ city: '1', country: '2', postalCode: '3', street: '4' });
    assign(jon, { address4: { city: '41', country: '42', postalCode: '43', street: '44' } });
    expect(jon.address4).toMatchObject({ city: '41', country: '42', postalCode: '43', street: '44' });
  });

  test('embeddable with zero value', async () => {
    const parent = new Parent();
    parent.foo = 0;
    const child = new Child();
    child.bar = 0;
    parent.child = child;
    expect(parent.foo).toBe(0);
    expect(parent.child.bar).toBe(0);
    await orm.em.persistAndFlush(parent);
    expect(parent.foo).toBe(0);
    expect(parent.child.bar).toBe(0);
    const p = await orm.em.fork().findOneOrFail(Parent, parent);
    expect(p.foo).toBe(0);
    expect(p.child.bar).toBe(0);
  });

  test('embeddable with inherited properties (GH issue #1049)', async () => {
    const runTests = (user: User): void => {
      expect(user.address1).toBeInstanceOf(Address1);
      expect(user.address1).toEqual({
        street: 'Rainbow st. 1',
        postalCode: '001',
        city: 'London',
        country: 'UK',
      });
      expect(user.address2).toBeInstanceOf(Address2);
      expect(user.address2).toEqual({
        street: 'Rainbow st. 2',
        postalCode: null,
        city: 'London',
        country: 'UK',
      });
    };

    const john = new User();
    john.address1 = new Address1('Rainbow st. 1', '001', 'London', 'UK');
    john.address2 = new Address2('Rainbow st. 2', 'London', 'UK');
    await orm.em.persistAndFlush(john);
    orm.em.clear();

    const j1 = await orm.em.findOneOrFail(User, john.id);
    runTests(j1);
    orm.em.clear();

    const j2 = await orm.em.findOneOrFail(User, { address1: { street: 'Rainbow st. 1' } });
    expect(j2).not.toBe(null);
    runTests(j2);
    orm.em.clear();
  });

  test('assign entity changes on embeddables (GH issue 1083)', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });

    const john = await orm.em.findOneOrFail(User, { address1: { street: 'Rainbow st. 1' } });
    const data: any = {};
    // data.address1 = { street: 'Rainbow st. 3', postalCode: '003', city: 'London', country: 'UKK' };
    data.address1 = new Address1('Rainbow st. 3', '003', 'London', 'UKK');
    data.address1.street = 'Rainbow st. 33';

    orm.em.assign(john, data);
    await orm.em.persistAndFlush(john);
    orm.em.clear();

    expect(mock.mock.calls.length).toBe(2);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('user'\)\.updateMany\({ _id: .* }, { '\$set': { address1_street: 'Rainbow st. 33', address1_postalCode: '003', address1_country: 'UKK' } }, { session: undefined }\);/);

    const j1 = await orm.em.findOneOrFail(User, { address1: { street: 'Rainbow st. 33' } });
    expect(j1).not.toBe(null);
    expect(j1.address1).toEqual({
      street: 'Rainbow st. 33',
      postalCode: '003',
      city: 'London',
      country: 'UKK',
    });
    orm.em.clear();
  });

  test('embeddables should work with custom type properties', async () => {
    const user = new CustomUser();
    user.address = new CustomAddress('my street', 123.02);
    await orm.em.persistAndFlush(user);
    orm.em.clear();

    const retrievedUser = await orm.em.findOneOrFail(CustomUser, { address: { street: 'my street' } });
    expect(retrievedUser.address.postalCode).toStrictEqual(123.02);
  });

});
