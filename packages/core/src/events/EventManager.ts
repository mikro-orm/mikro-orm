import type { AnyEntity, AsyncFunction, EntityKey, EntityMetadata } from '../typings';
import type { EventArgs, EventSubscriber, FlushEventArgs, TransactionEventArgs } from './EventSubscriber';
import { Utils } from '../utils';
import { EventType, EventTypeMap, type TransactionEventType } from '../enums';

export class EventManager {

  private readonly listeners: { [K in EventType]?: EventSubscriber[] } = {};
  private readonly entities: Map<EventSubscriber, string[]> = new Map();
  private readonly cache: Map<number, boolean> = new Map();
  private readonly subscribers: EventSubscriber[] = [];

  constructor(subscribers: EventSubscriber[]) {
    subscribers.forEach(subscriber => this.registerSubscriber(subscriber));
  }

  registerSubscriber(subscriber: EventSubscriber): void {
    this.subscribers.push(subscriber);
    this.entities.set(subscriber, this.getSubscribedEntities(subscriber));
    this.cache.clear();
    Utils.keys(EventType)
      .filter(event => event in subscriber)
      .forEach(event => {
        this.listeners[event] ??= [];
        this.listeners[event]!.push(subscriber);
      });
  }

  dispatchEvent<T extends object>(event: TransactionEventType, args: TransactionEventArgs, meta?: EntityMetadata<T>): unknown;
  dispatchEvent<T extends object>(event: EventType.onInit, args: Partial<EventArgs<T>>, meta?: EntityMetadata<T>): unknown;
  dispatchEvent<T extends object>(event: EventType, args: Partial<EventArgs<T> | FlushEventArgs>, meta?: EntityMetadata<T>): Promise<unknown>;
  dispatchEvent<T extends object>(event: EventType, args: Partial<AnyEventArgs<T>>, meta?: EntityMetadata<T>): Promise<unknown> | unknown {
    const listeners: AsyncFunction[] = [];
    const entity = (args as EventArgs<T>).entity;

    // execute lifecycle hooks first
    meta ??= (entity as AnyEntity)?.__meta;
    const hooks = (meta?.hooks[event] || []) as AsyncFunction[];
    listeners.push(...hooks.map(hook => {
      const prototypeHook = meta?.prototype[hook as unknown as EntityKey<T>];
      const handler = typeof hook === 'function' ? hook : entity[hook!] ?? prototypeHook as AsyncFunction;
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
    const cacheKey = meta._id + EventTypeMap[event];

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const hasHooks = meta.hooks[event]?.length;

    if (hasHooks) {
      this.cache.set(cacheKey, true);
      return true;
    }

    for (const listener of this.listeners[event] ?? []) {
      const entities = this.entities.get(listener)!;

      if (entities.length === 0 || entities.includes(meta.className)) {
        this.cache.set(cacheKey, true);
        return true;
      }
    }

    this.cache.set(cacheKey, false);
    return false;
  }

  clone() {
    return new EventManager(this.subscribers);
  }

  private getSubscribedEntities(listener: EventSubscriber): string[] {
    if (!listener.getSubscribedEntities) {
      return [];
    }

    return listener.getSubscribedEntities().map(name => Utils.className(name));
  }

}

type AnyEventArgs<T extends object> = EventArgs<T> | FlushEventArgs | TransactionEventArgs;
