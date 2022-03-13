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
    const listeners: (readonly [PropertyKey | NonNullable<EventSubscriber<T>[keyof EventSubscriber<T>]>, EventSubscriber<T> | AnyEntity<T>])[] = [];
    const entity: T = (args as EventArgs<T>).entity;

    // execute lifecycle hooks first
    const hooks = (entity && entity.__meta!.hooks[event]) || [];
    listeners.push(...hooks.map(hook => [hook, entity] as const));

    for (const listener of this.listeners[event] || []) {
      const entities = this.entities.get(listener)!;

      if (entities.length === 0 || !entity || entities.includes(entity.constructor.name)) {
        listeners.push([event, listener]);
      }
    }

    const runListener = ([hook, subscriber]: readonly [PropertyKey | NonNullable<EventSubscriber<T>[keyof EventSubscriber<T>]>, EventSubscriber<T> | AnyEntity<T>]) => {
      if (typeof hook !== 'function') {
        return subscriber[hook]!(args as (EventArgs<T> & FlushEventArgs & TransactionEventArgs));
      }
      return (hook as (args: Partial<EventArgs<T> | FlushEventArgs | TransactionEventArgs>) => Promise<unknown> | unknown).call(subscriber, args);
    };

    if (event === EventType.onInit) {
      return listeners.forEach(runListener);
    }

    return Utils.runSerial(listeners, runListener);
  }

  hasListeners<T extends AnyEntity<T>>(event: EventType, meta: EntityMetadata<T>): boolean {
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
