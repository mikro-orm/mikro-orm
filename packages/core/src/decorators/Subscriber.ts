import { Constructor } from '../typings';
import { MetadataStorage } from '../metadata';
import { EventSubscriber } from '../events';

export function Subscriber() {
  return function (target: Constructor<EventSubscriber>) {
    const subscribers = MetadataStorage.getSubscriberMetadata();
    subscribers[target.name] = new target();
  };
}
