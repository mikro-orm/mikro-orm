import { defineEntity, MikroORM, ObjectId, p } from '@mikro-orm/mongodb';

const UserTypes = ['heavy', 'casual', 'normal'] as const;

const UserSchema = defineEntity({
  abstract: true,
  discriminatorColumn: 'type',
  name: 'Entity',
  properties: {
    _id: p.type(ObjectId).primary(),
    name: p.string(),
    type: p.enum(UserTypes).hidden(),
  },
  tableName: 'entities',
});

class Entity extends UserSchema.class {}
UserSchema.setClass(Entity);

const HeavyUserSchema = defineEntity({
  discriminatorValue: 'heavy',
  extends: UserSchema,
  name: 'HeavyUser',
  properties: {
    devices: () => p.manyToMany(Device).mappedBy('heavyUsers'),
  },
});

class HeavyUser extends HeavyUserSchema.class {}
HeavyUserSchema.setClass(HeavyUser);

const CasualUserSchema = defineEntity({
  discriminatorValue: 'casual',
  extends: UserSchema,
  name: 'CasualUser',
  properties: {},
});

class CasualUser extends CasualUserSchema.class {}
CasualUserSchema.setClass(CasualUser);

const NormalUserSchema = defineEntity({
  discriminatorValue: 'normal',
  extends: UserSchema,
  name: 'NormalUser',
  properties: {
    devices: () => p.manyToMany(Device).mappedBy('normalUsers'),
  },
});

class NormalUser extends NormalUserSchema.class {}
NormalUserSchema.setClass(NormalUser);

const DeviceSchema = defineEntity({
  name: 'Device',
  properties: {
    _id: p.type(ObjectId).primary(),
    heavyUsers: () => p.manyToMany(HeavyUser),
    normalUsers: () => p.manyToMany(NormalUser).inversedBy('devices'),
  },
});

class Device extends DeviceSchema.class {}
DeviceSchema.setClass(Device);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [UserSchema, HeavyUserSchema, CasualUserSchema, NormalUserSchema, DeviceSchema],
    clientUrl: 'mongodb://localhost:27017/mikro-orm-ghx55',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('STI sibling without M:N relation can be removed across forked EMs', async () => {
  const em1 = orm.em.fork();
  const created = em1.create(CasualUser, { name: 'Casual User', type: 'casual' });
  await em1.flush();
  const id = created._id;

  const em2 = orm.em.fork();
  const user = await em2.findOne(CasualUser, { _id: id });
  expect(user).not.toBeNull();
  em2.remove(user!);
  await em2.flush();

  const gone = await orm.em.fork().findOne(CasualUser, { _id: id });
  expect(gone).toBeNull();
});
