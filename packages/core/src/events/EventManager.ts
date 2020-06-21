import { AnyEntity } from '../typings';
import { EntityManager } from '../EntityManager';
import { EventSubscriber } from './EventSubscriber';
import { Utils } from '../utils';
import { EventType } from './EventType';

export class EventManager {

  private readonly listeners: Partial<Record<EventType, EventSubscriber[]>> = {};
  private readonly entities: Map<EventSubscriber, string[]> = new Map();

  constructor(subscribers: EventSubscriber[]) {
    subscribers.forEach(subscriber => this.registerSubscriber(subscriber));
  }

  registerSubscriber(subscriber: EventSubscriber): void {
    this.entities.set(subscriber, this.getSubscribedEntities(subscriber));
    Object.keys(EventType)
      .filter(event => event in subscriber)
      .forEach(event => {
        this.listeners[event] = this.listeners[event] || [];
        this.listeners[event].push(subscriber);
      });
  }

  dispatchEvent(event: EventType.onInit, entity: AnyEntity, em: EntityManager): unknown;
  dispatchEvent(event: EventType, entity: AnyEntity, em: EntityManager): Promise<unknown>;
  dispatchEvent(event: EventType, entity: AnyEntity, em: EntityManager): Promise<unknown> | unknown {
    const listeners: EventSubscriber[] = [];

    for (const listener of this.listeners[event] || []) {
      const entities = this.entities.get(listener)!;

      if (entities.length === 0 || entities.includes(entity.constructor.name)) {
        listeners.push(listener);
      }
    }

    if (event === EventType.onInit) {
      return listeners.forEach(listener => listener[event]!({ em, entity }));
    }

    return Utils.runSerial(listeners, listener => listener[event]!({ em, entity }));
  }

  private getSubscribedEntities(listener: EventSubscriber): string[] {
    if (!listener.getSubscribedEntities) {
      return [];
    }

    return listener.getSubscribedEntities().map(name => Utils.className(name));
  }

}
