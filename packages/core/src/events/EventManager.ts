import { AnyEntity } from '../typings';
import { EventArgs, EventSubscriber } from './EventSubscriber';
import { Utils } from '../utils';
import { EventType } from './EventType';
import { wrap } from '../entity/wrap';

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

  dispatchEvent<T extends AnyEntity<T>>(event: EventType.onInit, entity: T, args: Partial<EventArgs<T>>): unknown;
  dispatchEvent<T extends AnyEntity<T>>(event: EventType, entity: T, args: Partial<EventArgs<T>>): Promise<unknown>;
  dispatchEvent<T extends AnyEntity<T>>(event: EventType, entity: T, args: Partial<EventArgs<T>>): Promise<unknown> | unknown {
    const listeners: [EventType, EventSubscriber<T>][] = [];

    // execute lifecycle hooks first
    const hooks = wrap(entity, true).__meta.hooks[event] || [];
    listeners.push(...hooks.map(hook => [hook, entity] as [EventType, EventSubscriber<T>]));

    for (const listener of this.listeners[event] || []) {
      const entities = this.entities.get(listener)!;

      if (entities.length === 0 || entities.includes(entity.constructor.name)) {
        listeners.push([event, listener]);
      }
    }

    if (event === EventType.onInit) {
      return listeners.forEach(listener => listener[1][listener[0]]!({ ...args, entity } as EventArgs<T>));
    }

    return Utils.runSerial(listeners, listener => listener[1][listener[0]]!({ ...args, entity } as EventArgs<T>) as Promise<void>);
  }

  private getSubscribedEntities(listener: EventSubscriber): string[] {
    if (!listener.getSubscribedEntities) {
      return [];
    }

    return listener.getSubscribedEntities().map(name => Utils.className(name));
  }

}
