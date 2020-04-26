import { Embeddable, Embedded, Entity, Logger, MikroORM, PrimaryKey, Property, ReferenceType, wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';

@Embeddable()
class Address1 {

  @Property()
  street?: string;

  @Property()
  postalCode?: string;

  @Property()
  city?: string;

  @Property()
  country?: string;

  constructor(street?: string, postalCode?: string, city?: string, country?: string) {
    this.street = street;
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

  @Embedded( { prefix: 'addr_', nullable: true })
  address2?: Address2;

  @Embedded( { prefix: false })
  address3: Address1 = new Address1();

}

describe('embedded entities in mysql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Address1, Address2, User],
      dbName: `mikro_orm_test_embeddables`,
      type: 'mysql',
      port: 3307,
      cache: { enabled: false },
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
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

  test('schema', async () => {
    await expect(orm.getSchemaGenerator().getCreateSchemaSQL(false)).resolves.toMatchSnapshot('embeddables');
  });

  test('persist and load', async () => {
    const user = new User();
    user.address1 = new Address1('Downing street 10', '123', 'London 1', 'UK 1');
    user.address2 = new Address2('Downing street 11', 'London 2', 'UK 2');
    user.address3 = new Address1('Downing street 12', '789', 'London 3', 'UK 3');

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    orm.config.set('highlight', false);
    await orm.em.persistAndFlush(user);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `user` (`addr_city`, `addr_country`, `addr_postal_code`, `addr_street`, `address1_city`, `address1_country`, `address1_postal_code`, `address1_street`, `city`, `country`, `postal_code`, `street`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    const u = await orm.em.findOneOrFail(User, user.id);
    expect(mock.mock.calls[3][0]).toMatch('select `e0`.* from `user` as `e0` where `e0`.`id` = ? limit ?');
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

    u.address2!.postalCode = '111';
    await orm.em.flush();
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('update `user` set `addr_postal_code` = ? where `id` = ?');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    orm.em.clear();

    const u1 = await orm.em.findOneOrFail(User, { address1: { city: 'London 1', postalCode: '123' } });
    expect(mock.mock.calls[7][0]).toMatch('select `e0`.* from `user` as `e0` where `e0`.`address1_city` = ? and `e0`.`address1_postal_code` = ? limit ?');
    expect(u1.address1.city).toBe('London 1');
    expect(u1.address1.postalCode).toBe('123');
    const u2 = await orm.em.findOneOrFail(User, { address1: { city: /^London/ } });
    expect(mock.mock.calls[8][0]).toMatch('select `e0`.* from `user` as `e0` where `e0`.`address1_city` like ? limit ?');
    expect(u2.address1.city).toBe('London 1');
    expect(u2.address1.postalCode).toBe('123');
    expect(u2).toBe(u1);
    const u3 = await orm.em.findOneOrFail(User, { $or: [{ address1: { city: 'London 1' } }, { address1: { city: 'Berlin' } }] });
    expect(mock.mock.calls[8][0]).toMatch('select `e0`.* from `user` as `e0` where `e0`.`address1_city` like ? limit ?');
    expect(u3).toBe(u1);
    const err = `Using operators inside embeddables is not allowed, move the operator above. (property: User.address1, payload: { address1: { '$or': [ [Object], [Object] ] } })`;
    await expect(orm.em.findOneOrFail(User, { address1: { $or: [{ city: 'London 1' }, { city: 'Berlin' }] } })).rejects.toThrowError(err);
  });

  test('assign', async () => {
    const user = new User();
    wrap(user).assign({
      address1: { street: 'Downing street 10', postalCode: '123', city: 'London 1', country: 'UK 1' },
      address2: { street: 'Downing street 11', city: 'London 2', country: 'UK 2' },
      address3: { street: 'Downing street 12', postalCode: '789', city: 'London 3', country: 'UK 3' },
    }, { em: orm.em });

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

});
