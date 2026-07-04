import { defineEntity, MikroORM, p, raw, ValidationError } from '@mikro-orm/sqlite';

enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

const AccountSchema = defineEntity({
  name: 'AccountValidation',
  properties: {
    id: p.integer().primary(),
    username: p.string(),
    age: p.integer().nullable(),
    active: p.boolean().default(true),
    role: p.enum(() => Role),
    score: p.decimal('number').default(0),
  },
});
class Account extends AccountSchema.class {}
AccountSchema.setClass(Account);

describe('property validation on assign and flush', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Account],
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.schema.clear());

  test('em.assign validates enum and scalar properties', async () => {
    const account = orm.em.create(Account, {
      username: 'john',
      age: 30,
      role: Role.USER,
    });
    await orm.em.flush();

    expect(() => orm.em.assign(account, { role: 'guest' as Role })).toThrow(ValidationError);
    expect(() => orm.em.assign(account, { age: 'invalid' as unknown as number })).toThrow(/type 'number'/);
    expect(() => orm.em.assign(account, { active: 'yes' as unknown as boolean })).toThrow(/type 'boolean'/);

    orm.em.assign(account, { role: Role.ADMIN, age: 31 });
    expect(account.role).toBe(Role.ADMIN);
    expect(account.age).toBe(31);
  });

  test('validateEntity on flush rejects invalid enum values set directly', async () => {
    const account = orm.em.create(Account, {
      username: 'john',
      age: 30,
      role: Role.USER,
    });
    await orm.em.flush();

    account.role = 'invalid' as Role;

    await expect(orm.em.flush()).rejects.toThrow(ValidationError);
  });

  test('validateEntity on flush rejects invalid boolean values set directly', async () => {
    const account = orm.em.create(Account, {
      username: 'john',
      age: 30,
      role: Role.USER,
    });
    await orm.em.flush();

    account.active = 'yes' as unknown as boolean;

    await expect(orm.em.flush()).rejects.toThrow(/type 'boolean'/);
  });

  test('null and raw fragments skip property validation during assign', async () => {
    const account = orm.em.create(Account, {
      username: 'john',
      age: 30,
      role: Role.USER,
      score: raw('1 + 1'),
    });

    expect(() => orm.em.assign(account, { age: null })).not.toThrow();
    expect(() => orm.em.assign(account, { score: raw('2 + 2') })).not.toThrow();
    expect(account.age).toBeNull();
    expect(account.score).toEqual(raw('2 + 2'));
  });
});
