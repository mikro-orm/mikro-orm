import type { Constructor } from '../typings';
import { MetadataStorage } from '../metadata';
import type { EventSubscriber } from '../events';

/** @deprecated This decorator will be removed in v6, prefer the `subscribers` option in the ORM config. */
export function Subscriber() {
  return function (target: Constructor<EventSubscriber>) {
    const subscribers = MetadataStorage.getSubscriberMetadata();
    subscribers[target.name] = new target();
  };
}
