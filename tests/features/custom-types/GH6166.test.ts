import { MikroORM, EntitySchema, Type, Platform } from '@mikro-orm/sqlite';

export class UserId {

  static create(value: number): UserId {
    return new UserId(value);
  }

  private readonly _value: number;

  private constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Invalid UserId value');
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: UserId): boolean {
    return other && this._value === other._value;
  }

  toString(): string {
    return '' + this._value;
  }

}

class User {

  private _id!: UserId;

  private _name: string;

  private _email: string;

  constructor(name: string, email: string) {
    this._name = name;
    this._email = email;
  }

  get id(): UserId {
    return this._id;
  }

  private set id(value: UserId) {
    this._id = value;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
    };
  }

}

class UserIdType extends Type<UserId | undefined, number | undefined> {

  convertToDatabaseValue(
    value: UserId | undefined,
    platform: Platform,
  ): number | undefined {
    return value instanceof UserId ? value.value : value;
  }

  convertToJSValue(
    value: number | undefined,
    platform: Platform,
  ): UserId | undefined {
    return typeof value === 'number' ? UserId.create(value) : value;
  }

  getColumnType(): string {
    return 'int';
  }

  compareAsType(): string {
    return 'number';
  }

}

const userSchema = new EntitySchema<User>({
  class: User,
  properties: {
    id: { primary: true, type: UserIdType, autoincrement: true },
    name: { type: 'string' },
    email: { type: 'string', unique: true },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [userSchema],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6166', async () => {
  const u1 = orm.em.create(User, { name: 'Foo', email: 'foo' });
  const u2 = orm.em.create(User, { name: 'Foo1', email: 'foo1' });
  const u3 = orm.em.create(User, { name: 'Foo2', email: 'foo2' });
  await orm.em.flush();

  expect(u1.id).toBeInstanceOf(UserId);
  expect(u1.id.value).toBe(1);
  expect(u2.id).toBeInstanceOf(UserId);
  expect(u2.id.value).toBe(2);
  expect(u3.id).toBeInstanceOf(UserId);
  expect(u3.id.value).toBe(3);

  orm.em.clear();

  const users = await orm.em.findAll(User);
  expect(users.length).toBe(3);
  expect(users[0].id).toBeInstanceOf(UserId);
  expect(users[0].id.value).toBe(1);
  expect(users[1].id).toBeInstanceOf(UserId);
  expect(users[1].id.value).toBe(2);
  expect(users[2].id).toBeInstanceOf(UserId);
  expect(users[2].id.value).toBe(3);
});

test('validate toString() on primary key objects', async () => {
  Reflect.deleteProperty(UserId.prototype, 'toString');
  orm.em.create(User, { name: 'Foo3', email: 'foo3' });
  const err = `Cannot serialize primary key for entity User, please implement 'toString()' method on the value object.`;
  await expect(orm.em.flush()).rejects.toThrow(err);
});
