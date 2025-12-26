import { Entity, PrimaryKey } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey({ type: 'number' })
  id!: number;

}

class UserSubscriber {}

describe('EventManager', () => {
  let orm: MikroORM;

  beforeEach(async () => {
    orm = new MikroORM({
      entities: [User],
      subscribers: new Set([new UserSubscriber()]),
      dbName: ':memory:',
    });
  });

  afterEach(async () => orm.close(true));

  test('should register preconfigured subscribers', async () => {
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(1);
  });

  test('should register a new instance of the subscriber', async () => {
    orm.em.getEventManager().registerSubscriber(new UserSubscriber());
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(2);
  });

  test('should register only one subscriber of the same instance', async () => {
    const subscriber = new UserSubscriber();
    orm.em.getEventManager().registerSubscriber(subscriber);
    orm.em.getEventManager().registerSubscriber(subscriber);
    orm.em.getEventManager().registerSubscriber(subscriber);
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(2);
  });

  test('should fork with registered subscribers', async () => {
    orm.em.getEventManager().registerSubscriber(new UserSubscriber());

    const em = orm.em.fork();
    expect(orm.em.getEventManager().getSubscribers()).toStrictEqual(em.getEventManager().getSubscribers());
  });

  test('should fork with registered subscribers (freshEventManager: true)', async () => {
    const em = orm.em.fork({
      freshEventManager: true,
    });

    em.getEventManager().registerSubscriber(new UserSubscriber());
    expect(em.getEventManager().getSubscribers().size).toEqual(2);
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(1);
  });

  test('should fork with registered subscribers (cloneEventManager: true)', async () => {
    const em = orm.em.fork({
      cloneEventManager: true,
    });

    em.getEventManager().registerSubscriber(new UserSubscriber());
    expect(em.getEventManager().getSubscribers().size).toEqual(2);
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(1);
  });
});
