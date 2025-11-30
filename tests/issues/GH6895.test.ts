import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @Property({ persist: false })
  get initials(): string {
    return (this.firstName[0] || '') + (this.lastName[0] || '');
  }

  constructor(lastName: string, firstName: string) {
    this.lastName = lastName;
    this.firstName = firstName;
  }

}

@Entity()
class Notification {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  recipient: User;

  @Property()
  type: string;

  constructor(user: User, type = 'test') {
    this.recipient = user;
    this.type = type;
  }

}

let orm: MikroORM;
let notification: Notification;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Notification],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  // remove all entities
  await orm.em.nativeDelete(Notification, {});
  await orm.em.nativeDelete(User, {});
  orm.em.clear();

  // create new entities
  const user1 = new User('Bar', 'Foo');
  await orm.em.persist(user1).flush();
  orm.em.clear();

  notification = new Notification(user1);
  await orm.em.persist(notification).flush();
  orm.em.clear();
});

describe('transactional', () => {
  test('fail, because non-populated relation on a fetch entity', async () => {
    await orm.em.findOneOrFail(Notification, { id: notification.id });
    await orm.em.transactional(async () => {
      //
    });
  });

  test('success, because of clear:true option', async () => {
    await orm.em.findOneOrFail(Notification, { id: notification.id });
    await orm.em.transactional(async () => {
      //
    }, { clear: true });
  });

  test('success, because em.clear() before', async () => {
    await orm.em.findOneOrFail(Notification, { id: notification.id });
    orm.em.clear();
    await orm.em.transactional(async () => {
      //
    });
  });

  test('success, because populated relation in context', async () => {
    await orm.em.findOneOrFail(Notification, { id: notification.id }, { populate: ['recipient'] });
    await orm.em.transactional(async () => {
      //
    });
  });

  test('fail, with fetch in inner context', async () => {
    await orm.em.transactional(async em => {
      await em.findOneOrFail(Notification, { id: notification.id });
    }, { clear: true });
  });
});

describe('EntityValidator', () => {
  test('validate fails, because relation not populated', async () => {
    const fecthedNotification = await orm.em.findOneOrFail(Notification, { id: notification.id });
    const userMetadata = orm.em.getMetadata().find(User);
    orm.em.getValidator().validate(fecthedNotification.recipient, fecthedNotification.recipient, userMetadata!);
  });
  test('validate succeed, because relation populated', async () => {
    const fecthedNotification = await orm.em.findOneOrFail(Notification, { id: notification.id }, { populate: ['recipient'] });
    const userMetadata = orm.em.getMetadata().find(User);
    orm.em.getValidator().validate(fecthedNotification.recipient, fecthedNotification.recipient, userMetadata!);
  });
});
