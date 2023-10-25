import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property, ReferenceKind, wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { mockLogger } from '../../helpers';

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

  @Property({ nullable: true })
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

  @Embedded(() => Address1)
  address1!: Address1;

  @Embedded(() => Address2, { prefix: 'addr_', nullable: true })
  address2?: Address2;

  @Embedded({ prefix: false })
  address3: Address1 = new Address1();

  @Embedded({ object: true })
  address4: Address1 = new Address1();

  @Embedded({ object: true, nullable: true })
  address5?: Address1;

  @Property({ nullable: true })
  after?: number; // property after embeddables to verify order props in resulting schema

}

@Entity()
class UserWithCity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Address1, { object: false, prefix: false })
  address1!: Address1;

  @Property({ type: String })
  city!: string;

}

describe('embedded entities in mysql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: `mikro_orm_test_embeddables`,
      driver: MySqlDriver,
      port: 3308,
    });
    await orm.schema.refreshDatabase();
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
    expect(orm.getMetadata().get('User').properties.addr_street).toMatchObject({
      name: 'addr_street',
      kind: ReferenceKind.SCALAR,
      type: 'string',
      nullable: true,
    });
    expect(orm.getMetadata().get('User').properties.address3).toMatchObject({
      name: 'address3',
      kind: ReferenceKind.EMBEDDED,
      type: 'Address1',
    });
    expect(orm.getMetadata().get('User').properties.street).toMatchObject({
      name: 'street',
      kind: ReferenceKind.SCALAR,
      type: 'string',
    });
  });

  test('schema', async () => {
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('embeddables 1');
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('embeddables 2');
    await expect(orm.schema.getDropSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('embeddables 3');
  });

  test('persist and load', async () => {
    const user = new User();
    user.address1 = new Address1('Downing street 10', '123', 'London 1', 'UK 1');
    user.address2 = new Address2('Downing street 11', 'London 2', 'UK 2');
    user.address3 = new Address1('Downing street 12', '789', 'London 3', 'UK 3');
    user.address4 = new Address1('Downing street 13', '10', 'London 4', 'UK 4');

    const mock = mockLogger(orm, ['query']);
    await orm.em.persistAndFlush(user);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `user` (`address1_street`, `address1_postal_code`, `address1_city`, `address1_country`, `addr_street`, `addr_city`, `addr_country`, `street`, `postal_code`, `city`, `country`, `address4`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    const u = await orm.em.findOneOrFail(User, user.id);
    expect(mock.mock.calls[3][0]).toMatch('select `u0`.* from `user` as `u0` where `u0`.`id` = ? limit ?');
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
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('update `user` set `addr_postal_code` = ?, `address4` = ? where `id` = ?');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    orm.em.clear();

    const u1 = await orm.em.findOneOrFail(User, { address1: { city: 'London 1', postalCode: '123' } });
    expect(mock.mock.calls[7][0]).toMatch('select `u0`.* from `user` as `u0` where `u0`.`address1_city` = ? and `u0`.`address1_postal_code` = ? limit ?');
    expect(u1.address1.city).toBe('London 1');
    expect(u1.address1.postalCode).toBe('123');
    const u2 = await orm.em.findOneOrFail(User, { address1: { city: /^London/ } });
    expect(mock.mock.calls[8][0]).toMatch('select `u0`.* from `user` as `u0` where `u0`.`address1_city` like ? limit ?');
    expect(u2.address1.city).toBe('London 1');
    expect(u2.address1.postalCode).toBe('123');
    expect(u2).toBe(u1);
    const u3 = await orm.em.findOneOrFail(User, { $or: [{ address1: { city: 'London 1' } }, { address1: { city: 'Berlin' } }] });
    expect(mock.mock.calls[9][0]).toMatch('select `u0`.* from `user` as `u0` where (`u0`.`address1_city` = ? or `u0`.`address1_city` = ?) limit ?');
    expect(u3.address1.city).toBe('London 1');
    expect(u3.address1.postalCode).toBe('123');
    expect(u3).toBe(u1);
    const err = `Using operators inside embeddables is not allowed, move the operator above. (property: User.address1, payload: { address1: { '$or': [ [Object], [Object] ] } })`;
    await expect(orm.em.findOneOrFail(User, { address1: { $or: [{ city: 'London 1' }, { city: 'Berlin' }] } })).rejects.toThrowError(err);
    const u4 = await orm.em.findOneOrFail(User, { address4: { postalCode: '999' } });
    expect(u4).toBe(u1);
    expect(mock.mock.calls[10][0]).toMatch('select `u0`.* from `user` as `u0` where json_extract(`u0`.`address4`, \'$.postalCode\') = ? limit ?');
  });

  test('GH issue 3063', async () => {
    const user = new User();
    orm.em.assign(user, {
      address1: { street: 'Downing street 10', postalCode: '123', city: 'London 1', country: 'UK 1' },
      address2: { street: 'Downing street 11', city: 'London 2', country: 'UK 2' },
      address3: { street: 'Downing street 12', postalCode: '789', city: 'London 3', country: 'UK 3' },
    });
    await orm.em.persistAndFlush(user);
    const r = await orm.em.fork().findOneOrFail(User, user);
    expect(r.address5).toBe(null);
  });

  test('assign', async () => {
    const user = new User();
    wrap(user).assign({
      address1: { street: 'Downing street 10', postalCode: '123', city: 'London 1', country: 'UK 1' },
      address2: { street: 'Downing street 11', city: 'London 2', country: 'UK 2' },
      address3: { street: 'Downing street 12', postalCode: '789', city: 'London 3', country: 'UK 3' },
    }, { em: orm.em });
    orm.em.assign(user, { address4: { city: '41', country: '42', postalCode: '43', street: '44' } });
    expect(user.address4).toMatchObject({ city: '41', country: '42', postalCode: '43', street: '44' });

    orm.em.assign(user, { address5: { city: '51', country: '52', postalCode: '53', street: '54' } });
    expect(user.address5).toMatchObject({ city: '51', country: '52', postalCode: '53', street: '54' });

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

    orm.em.assign(user, { address2: undefined });
    expect(user.address2).toBe(undefined);

    orm.em.assign(user, { address2: null });
    expect(user.address2).toBe(null);

    expect(() => {
      orm.em.assign(user, { address4: undefined });
    }).toThrow('You must pass a non-undefined value to the property address4 of entity User.');

    expect(() => {
      orm.em.assign(user, { address4: null });
    }).toThrow('You must pass a non-null value to the property address4 of entity User.');


    orm.em.assign(user, { address5: undefined });
    expect(user.address5).toBe(undefined);

    orm.em.assign(user, { address5: null });
    expect(user.address5).toBe(null);
  });

  test('should throw error with colliding definition of inlined embeddables without prefix', async () => {
    const err = `Property UserWithCity:city is being overwritten by its child property address1:city. Consider using a prefix to overcome this issue.`;
    await expect(MikroORM.init({
      entities: [Address1, UserWithCity],
      dbName: `mikro_orm_test_embeddables`,
      driver: MySqlDriver,
      port: 3308,
    })).rejects.toThrow(err);
  });

});
