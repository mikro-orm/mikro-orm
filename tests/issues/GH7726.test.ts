import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';

const UserTypes = ['user', 'casual', 'heavy'] as const;

const UserSchema = defineEntity({
  discriminatorColumn: 'type',
  discriminatorValue: 'user',
  name: 'User',
  properties: {
    id: p.integer().primary(),
    type: p.enum(UserTypes).hidden(),
  },
});

class User extends UserSchema.class {}
UserSchema.setClass(User);

const CasualUserSchema = defineEntity({
  discriminatorValue: 'casual',
  extends: UserSchema,
  name: 'CasualUser',
  properties: {},
});

class CasualUser extends CasualUserSchema.class {}
CasualUserSchema.setClass(CasualUser);

const HeavyUserSchema = defineEntity({
  discriminatorValue: 'heavy',
  extends: UserSchema,
  name: 'HeavyUser',
  properties: {},
});

class HeavyUser extends HeavyUserSchema.class {}
HeavyUserSchema.setClass(HeavyUser);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [UserSchema, CasualUserSchema, HeavyUserSchema],
  });
});

beforeEach(async () => {
  await orm.schema.refresh();
  const em = orm.em.fork();
  em.create(User, { id: 1, type: 'user' });
  em.create(CasualUser, { id: 2, type: 'casual' });
  em.create(HeavyUser, { id: 3, type: 'heavy' });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('STI subclass discriminator applies on SELECT and DELETE (defineEntity extends)', async () => {
  // SELECT path: querying a subclass must filter by the subclass discriminator,
  // not the root's — used to wrongly return zero rows / wrong-type rows.
  const casualOnly = await orm.em.fork().find(CasualUser, {});
  expect(casualOnly.map(u => u.id)).toEqual([2]);

  // DELETE path: removing a subclass must scope the delete to subtype rows,
  // not the root discriminator value — used to delete 0 rows.
  const em = orm.em.fork();
  const casual = await em.findOneOrFail(CasualUser, { id: 2 });
  em.remove(casual);
  await em.flush();

  const stillAlive = await em.fork().find(User, {});
  expect(stillAlive.map(u => u.id).sort()).toEqual([1, 3]);

  const deadBody = await em.fork().findOne(CasualUser, { id: 2 });
  expect(deadBody).toBeNull();
});
