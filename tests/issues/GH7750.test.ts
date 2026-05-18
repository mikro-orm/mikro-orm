import { Collection, MikroORM, ObjectId, ValidationError } from '@mikro-orm/mongodb';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  _id!: ObjectId;

  @ManyToMany({ entity: () => Device, mappedBy: 'users' })
  devices = new Collection<Device>(this);
}

@Entity()
class Device {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @ManyToMany({ entity: () => User, inversedBy: 'devices' })
  users = new Collection<User>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Device],
    clientUrl: 'mongodb://localhost:27017/mikro-orm-7750',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

beforeEach(async () => {
  await orm.schema.refresh();
  const em = orm.em.fork();
  const user = em.create(User, {});
  em.create(Device, { name: 'Monitor', users: [user] });
  await em.flush();
});

test('throws when removing target of inlined-pivot M:N without owning side initialized', async () => {
  const em = orm.em.fork();
  const user = await em.findOneOrFail(User, { _id: { $exists: true } });

  expect(() => em.remove(user)).toThrow(ValidationError);
  expect(() => em.remove(user)).toThrow(/devices.*owning side is not initialized/);
});

test('inlined pivot cleanup works when owning side is removed first', async () => {
  const em = orm.em.fork();
  const user = await em.findOneOrFail(User, { _id: { $exists: true } }, { populate: ['devices'] });

  for (const device of user.devices) {
    device.users.remove(user);
  }
  em.remove(user);
  await em.flush();

  const device = await em.fork().findOneOrFail(Device, { name: 'Monitor' });
  expect(device.users).toHaveLength(0);
});
