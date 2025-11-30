import type { MikroORM } from '@mikro-orm/core';
import { initORMMySql } from '../../bootstrap';
import { Test2Subscriber } from '../../subscribers/Test2Subscriber';

describe('EventManager', () => {

  let orm: MikroORM;

  beforeEach(async () => {
    orm = await initORMMySql();
  });

  afterEach(async () => orm.close(true));

  test('should register preconfigured subscribers', async () => {
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(1);
    expect(orm.em.getEventManager().getSubscribers().values().next().value).toBeInstanceOf(Test2Subscriber);
  });

  test('should register a new subscriber', async () => {
    orm.em.getEventManager().registerSubscriber(new Test2Subscriber());
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(2);
  });

  test('should register only one subscriber of the same instance', async () => {
    const subscriber = new Test2Subscriber();
    orm.em.getEventManager().registerSubscriber(subscriber);
    orm.em.getEventManager().registerSubscriber(subscriber);
    orm.em.getEventManager().registerSubscriber(subscriber);
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(2);
  });

  test('should fork with registered subscribers', async () => {
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(1);

    const em = orm.em.fork();
    expect(orm.em.getEventManager().getSubscribers()).toStrictEqual(em.getEventManager().getSubscribers());
  });

  test('should fork with registered subscribers (freshEventManager: true)', async () => {
    const em = orm.em.fork({
      freshEventManager: true,
    });

    em.getEventManager().registerSubscriber(new Test2Subscriber());
    em.getEventManager().registerSubscriber(new Test2Subscriber());
    expect(em.getEventManager().getSubscribers().size).toEqual(3);
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(1);
  });

  test('should fork with registered subscribers (cloneEventManager: true)', async () => {
    const em = orm.em.fork({
      cloneEventManager: true,
    });

    em.getEventManager().registerSubscriber(new Test2Subscriber());
    em.getEventManager().registerSubscriber(new Test2Subscriber());
    expect(em.getEventManager().getSubscribers().size).toEqual(3);
    expect(orm.em.getEventManager().getSubscribers().size).toEqual(1);
  });
});
