import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';

const UserTypes = ['heavy', 'casual', 'normal'] as const;

const UserSchema = defineEntity({
  abstract: true,
  discriminatorColumn: 'type',
  name: 'Entity',
  properties: {
    id: p
      .uuid()
      .primary()
      .onCreate(() => crypto.randomUUID()),
    name: p.string(),
    type: p.enum(UserTypes).hidden(),
  },
  tableName: 'user',
});

class User extends UserSchema.class {}
UserSchema.setClass(User);

const NormalUserSchema = defineEntity({
  discriminatorValue: 'normal',
  extends: UserSchema,
  name: 'NormalUser',
  properties: {},
});

class NormalUser extends NormalUserSchema.class {}
NormalUserSchema.setClass(NormalUser);

const HeavyUserSchema = defineEntity({
  discriminatorValue: 'heavy',
  extends: User,
  name: 'HeavyUser',
  properties: {
    age: p.integer(),
  },
});

class HeavyUser extends HeavyUserSchema.class {}
HeavyUserSchema.setClass(HeavyUser);

const CasualUserSchema = defineEntity({
  discriminatorValue: 'casual',
  extends: User,
  name: 'CasualUser',
  properties: {
    age: p.integer(),
  },
});

class CasualUser extends CasualUserSchema.class {}
CasualUserSchema.setClass(CasualUser);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, NormalUser, HeavyUser, CasualUser],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
  const em = orm.em.fork();
  em.create(NormalUser, { id: '1', name: 'Normal User', type: 'normal' });
  await em.flush();
});

afterAll(() => orm.close(true));

test(`subtype-specific property is not pushed down to siblings that don't declare it`, async () => {
  const em = orm.em.fork();
  const user = await em.findOne(NormalUser, { id: '1' });
  expect(user).not.toBeNull();
  expect('age' in user!).toBe(false);

  // the subtypes that declare `age` must still keep it
  expect(orm.getMetadata(HeavyUser).properties.age).toBeDefined();
  expect(orm.getMetadata(CasualUser).properties.age).toBeDefined();
  expect('age' in orm.getMetadata(NormalUser).properties).toBe(false);
});
