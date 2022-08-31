import type { AnyEntity, AsyncFunction, EntityMetadata } from '../typings';
import type { EventArgs, EventSubscriber, FlushEventArgs, TransactionEventArgs } from './EventSubscriber';
import { Utils } from '../utils';
import type { TransactionEventType } from '../enums';
import { EventType } from '../enums';

export class EventManager {

  private readonly listeners: { [K in EventType]?: EventSubscriber[] } = {};
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

  dispatchEvent<T>(event: TransactionEventType, args: TransactionEventArgs): unknown;
  dispatchEvent<T>(event: EventType.onInit, args: Partial<EventArgs<T>>): unknown;
  dispatchEvent<T>(event: EventType, args: Partial<EventArgs<T> | FlushEventArgs>): Promise<unknown>;
  dispatchEvent<T>(event: EventType, args: Partial<AnyEventArgs<T>>): Promise<unknown> | unknown {
    const listeners: AsyncFunction[] = [];
    const entity = (args as EventArgs<T>).entity;

    // execute lifecycle hooks first
    const hooks = ((entity as AnyEntity)?.__meta!.hooks[event] || []) as AsyncFunction[];
    listeners.push(...hooks.map(hook => {
      const handler = typeof hook === 'function' ? hook : entity[hook!] as AsyncFunction;
      return handler!.bind(entity);
    }));

    for (const listener of this.listeners[event] || []) {
      const entities = this.entities.get(listener)!;

      if (entities.length === 0 || !entity || entities.includes(entity.constructor.name)) {
        listeners.push(listener[event]!.bind(listener) as AsyncFunction);
      }
    }

    if (event === EventType.onInit) {
      return listeners.forEach(listener => listener(args));
    }

    return Utils.runSerial(listeners, listener => listener(args));
  }

  hasListeners<T>(event: EventType, meta: EntityMetadata<T>): boolean {
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

type AnyEventArgs<T> = EventArgs<T> | FlushEventArgs | TransactionEventArgs;
