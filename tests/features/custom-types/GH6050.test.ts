import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

type Devices = { mouse: string; keyboard: string };

@Entity()
class User {
  @PrimaryKey()
  _id!: ObjectId;

  @Property({ unique: true })
  email!: string;

  @Property({ type: 'json' })
  devices?: Devices;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6050',
    entities: [User],
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
});

afterAll(async () => {
  await orm.close(true);
});

it('should populate a json property that contains a default value in its prototype at entity creation', async () => {
  // create object with prototype containing a default value for the mouse brand
  const devices: Devices = Object.create({
    mouse: 'no-brand',
  });
  // set actual values
  devices.mouse = 'acme';
  devices.keyboard = 'acme';
  orm.em.create(User, {
    email: 'test@test.com',
    devices,
  });
  await orm.em.flush();
  orm.em.clear();

  const user2 = await orm.em.findOneOrFail(User, { email: 'test@test.com' });
  expect(user2.devices).toEqual({ mouse: 'acme', keyboard: 'acme' }); // this fails, property "mouse" is missing
});

it('should populate a json property that contains a default value in its prototype at entity update', async () => {
  orm.em.create(User, {
    email: 'test@test.com',
    devices: { mouse: 'nobrand', keyboard: 'nobrand' },
  });
  await orm.em.flush();
  orm.em.clear();

  const user2 = await orm.em.findOneOrFail(User, { email: 'test@test.com' });
  expect(user2.devices).toEqual({ mouse: 'nobrand', keyboard: 'nobrand' });
  // create object with prototype containing default value
  const devices: Devices = Object.create({
    mouse: 'nobrand',
  });
  // set actual values
  devices.mouse = 'acme';
  devices.keyboard = 'acme';
  user2.devices = devices;
  await orm.em.flush();
  orm.em.clear();

  const user3 = await orm.em.findOneOrFail(User, { email: 'test@test.com' });
  expect(user3.devices).toEqual({ mouse: 'acme', keyboard: 'acme' }); // this fails, property "mouse" is missing
});
