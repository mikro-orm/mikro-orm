import { Opt } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider, SerializedPrimaryKey } from '@mikro-orm/decorators/legacy';
import { ObjectId, MikroORM, wrap } from '@mikro-orm/mongodb';

@Embeddable()
class StripeSubscription {

  @Property()
  id!: string;

  @Property()
  start!: Date;

  @Property()
  end!: Date;

  @Property({ type: 'string' })
  status!: string;

}

@Embeddable()
class StripeSubscription2 {

  @Property()
  stripeId!: string;

  @Property()
  start!: Date;

  @Property()
  end!: Date;

  @Property({ type: 'string' })
  status!: string;

}

@Entity()
class User {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @Embedded(() => StripeSubscription, { array: true })
  stripeSubscriptions: StripeSubscription[] & Opt = [];

  @Embedded(() => StripeSubscription2, { array: true })
  stripeSubscriptions2: StripeSubscription2[] & Opt = [];

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    clientUrl: 'mongodb://localhost:27017/mikro_orm_4960',
    entities: [User, StripeSubscription, StripeSubscription2],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  orm.em.create(User, { name: 'Foo', email: 'foo' });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: 'foo' });
  expect(user.name).toBe('Foo');
  user.name = 'Bar';
  orm.em.remove(user);
  await orm.em.flush();

  const count = await orm.em.count(User, { email: 'foo' });
  expect(count).toBe(0);
});

test('Test Embeddabled', async () => {
  const user = orm.em.create(User, { name: 'Foo', email: 'foo' });
  await orm.em.flush();

  const sub1 = new StripeSubscription();
  wrap(sub1).assign({ id: 'aaa', start: new Date(), end: new Date(), status: 'ok' });
  user.stripeSubscriptions = [...user.stripeSubscriptions, sub1];

  const sub2 = new StripeSubscription2();
  wrap(sub2).assign({ stripeId: 'aaa', start: new Date(), end: new Date(), status: 'ok' });
  user.stripeSubscriptions2 = [...user.stripeSubscriptions2, sub2];

  await orm.em.flush();

  expect(user.stripeSubscriptions[0].id).toBe('aaa');
  expect(user.stripeSubscriptions2[0].stripeId).toBe('aaa');

  const user2 = await orm.em.findOneOrFail(User, { email: 'foo' });
  expect(user2.stripeSubscriptions[0].id).toBe('aaa');
  expect(user2.stripeSubscriptions2[0].stripeId).toBe('aaa');
});
