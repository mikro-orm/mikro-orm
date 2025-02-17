import {
  Embeddable,
  Embedded,
  Entity,
  EntitySchema,
  IntegerType,
  MikroORM, PrimaryKey,
  Property,
  ReferenceKind,
  StringType,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class Address1 {

  @Property({ name: 'street' })
  _street: string;

  @Property({ name: 'postalCode' })
  _postalCode: string;

  @Property({ name: 'city' })
  _city: string;

  @Property({ name: 'country' })
  _country: string;

  constructor(
    street: string,
    postalCode: string,
    city: string,
    country: string,
  ) {
    this._street = street;
    this._postalCode = postalCode;
    this._city = city;
    this._country = country;
  }

}

@Entity()
class User1 {

  @PrimaryKey({ name: 'id' })
  _id!: number;

  @Property({ name: 'fullName' })
  _fullName: string;

  @Embedded(() => Address1, { name: 'address', object: true })
  _address: Address1;

  constructor(fullName: string, address: Address1) {
    this._fullName = fullName;
    this._address = address;
  }

}

class Address {

  _street: string;
  _postalCode: string;
  _city: string;
  _country: string;

  constructor(
    street: string,
    postalCode: string,
    city: string,
    country: string,
  ) {
    this._street = street;
    this._postalCode = postalCode;
    this._city = city;
    this._country = country;
  }

}

class User {

  _id!: number;
  _fullName: string;
  _address: Address;

  constructor(fullName: string, address: Address) {
    this._fullName = fullName;
    this._address = address;
  }

}

const addressEntitySchema = new EntitySchema({
  class: Address,
  embeddable: true,
  properties: {
    _street: {
      fieldName: 'street',
      type: new StringType(),
    },
    _postalCode: {
      fieldName: 'postalCode',
      type: new StringType(),
    },
    _city: {
      fieldName: 'city',
      type: new StringType(),
    },
    _country: {
      fieldName: 'country',
      type: new StringType(),
    },
  },
});

const userEntitySchema = new EntitySchema({
  class: User,
  properties: {
    _id: {
      fieldName: 'id',
      primary: true,
      type: new IntegerType(),
    },
    _fullName: {
      fieldName: 'fullName',
      type: new StringType(),
    },
    _address: {
      name: 'address',
      kind: ReferenceKind.EMBEDDED,
      object: true,
      entity: () => Address,
    },
  },
  tableName: 'User',
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [addressEntitySchema, userEntitySchema, Address1, User1],
    dbName: `:memory:`,
  });
});

afterAll(async () => await orm.close(true));

test('Should create the right db schema', async () => {
  const sqlCreate = await orm.schema.getCreateSchemaSQL();
  const sqlUpdate = await orm.schema.getUpdateSchemaSQL();
  expect(sqlCreate.trim().split('\n')).toEqual([
    'create table `User` (`id` integer not null primary key autoincrement, `fullName` text not null, `address` json not null);',
    '',
    'create table `user1` (`id` integer not null primary key autoincrement, `fullName` text not null, `address` json not null);',
  ]);
  expect(sqlUpdate.trim().split('\n')).toEqual([
    'create table `User` (`id` integer not null primary key autoincrement, `fullName` text not null, `address` json not null);',
    '',
    'create table `user1` (`id` integer not null primary key autoincrement, `fullName` text not null, `address` json not null);',
  ]);

  await orm.schema.createSchema();
  orm.em.create(User, {
    _fullName: 'name',
    _address: {
      _street: 'street',
      _postalCode: 'postalCode',
      _city: 'city',
      _country: 'country',
    },
  });
  orm.em.create(User1, {
    _fullName: 'name',
    _address: {
      _street: 'street',
      _postalCode: 'postalCode',
      _city: 'city',
      _country: 'country',
    },
  });
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).toHaveBeenCalledTimes(4);
  expect(mock.mock.calls[1][0]).toMatch('insert into `user1` (`fullName`, `address`) values (\'name\', \'{"street":"street","postalCode":"postalCode","city":"city","country":"country"}\') returning `id`');
  expect(mock.mock.calls[2][0]).toMatch('insert into `User` (`fullName`, `address`) values (\'name\', \'{"street":"street","postalCode":"postalCode","city":"city","country":"country"}\') returning `id`');
});
