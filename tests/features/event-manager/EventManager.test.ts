import type { MikroORM } from '@mikro-orm/core';
import { initORMSqlite } from '../../bootstrap';
import { Test2Subscriber } from '../../subscribers/Test2Subscriber';

describe('EventManager', () => {

  let orm: MikroORM;

  beforeEach(async () => {
    orm = await initORMSqlite();
  });

  afterEach(async () => orm.close(true));

  test('should register preconfigured subscribers', async () => {
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(0);
  });

  test('should register a new subscriber', async () => {
    orm.em.getEventManager().registerSubscriber(new Test2Subscriber());
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(1);
  });

  test('should register only one subscriber of the same instance', async () => {
    const subscriber = new Test2Subscriber();
    orm.em.getEventManager().registerSubscriber(subscriber);
    orm.em.getEventManager().registerSubscriber(subscriber);
    orm.em.getEventManager().registerSubscriber(subscriber);
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(1);
  });

  test('should fork with registered subscribers', async () => {
    orm.em.getEventManager().registerSubscriber(new Test2Subscriber());

    const em = orm.em.fork();
    expect(orm.em.getEventManager().getSubscribers()).toStrictEqual(em.getEventManager().getSubscribers());
  });

  test('should fork with registered subscribers (freshEventManager: true)', async () => {
    const em = orm.em.fork({
      freshEventManager: true,
    });

    em.getEventManager().registerSubscriber(new Test2Subscriber());
    em.getEventManager().registerSubscriber(new Test2Subscriber());
    expect(em.getEventManager().getSubscribers().size).toEqual(2);
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(0);
  });

  test('should fork with registered subscribers (cloneEventManager: true)', async () => {
    const em = orm.em.fork({
      cloneEventManager: true,
    });

    em.getEventManager().registerSubscriber(new Test2Subscriber());
    em.getEventManager().registerSubscriber(new Test2Subscriber());
    expect(em.getEventManager().getSubscribers().size).toEqual(2);
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(0);
  });
});
