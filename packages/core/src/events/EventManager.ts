import type { AnyEntity, EntityMetadata } from '../typings';
import type { EventArgs, EventSubscriber, FlushEventArgs, TransactionEventArgs } from './EventSubscriber';
import { Utils } from '../utils';
import type { TransactionEventType } from '../enums';
import { EventType } from '../enums';

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

  dispatchEvent<T extends AnyEntity<T>>(event: TransactionEventType, args: TransactionEventArgs): unknown;
  dispatchEvent<T extends AnyEntity<T>>(event: EventType.onInit, args: Partial<EventArgs<T>>): unknown;
  dispatchEvent<T extends AnyEntity<T>>(event: EventType, args: Partial<EventArgs<T> | FlushEventArgs>): Promise<unknown>;
  dispatchEvent<T extends AnyEntity<T>>(event: EventType, args: Partial<EventArgs<T> | FlushEventArgs | TransactionEventArgs>): Promise<unknown> | unknown {
    const listeners: [EventType, EventSubscriber<T>][] = [];
    const entity: T = (args as EventArgs<T>).entity;

    // execute lifecycle hooks first
    const hooks = (entity && entity.__meta!.hooks[event]) || [];
    listeners.push(...hooks.map(hook => [hook, entity] as [EventType, EventSubscriber<T>]));

    for (const listener of this.listeners[event] || []) {
      const entities = this.entities.get(listener)!;

      if (entities.length === 0 || !entity || entities.includes(entity.constructor.name)) {
        listeners.push([event, listener]);
      }
    }

    if (event === EventType.onInit) {
      return listeners.forEach(listener => listener[1][listener[0]]!(args as (EventArgs<T> & FlushEventArgs & TransactionEventArgs)));
    }

    return Utils.runSerial(listeners, listener => listener[1][listener[0]]!(args as (EventArgs<T> & FlushEventArgs & TransactionEventArgs)) as Promise<void>);
  }

  hasListeners<T extends AnyEntity<T>>(event: EventType, meta: EntityMetadata<T>): boolean {
    /* istanbul ignore next */
    const hasHooks = meta.hooks[event]?.length;

    if (hasHooks) {
      return true;
    }

    for (const listener of this.listeners[event] ?? []) {
      const entities = this.entities.get(listener)!;

      if (entities.length === 0 || entities.includes(meta.className)) {
        return true;
      }
    }

    return false;
  }

  private getSubscribedEntities(listener: EventSubscriber): string[] {
    if (!listener.getSubscribedEntities) {
      return [];
    }

    return listener.getSubscribedEntities().map(name => Utils.className(name));
  }

}
