import { AnyEntity } from '../typings';
import { MetadataStorage } from '../metadata';

export function Embeddable(): Function {
  return function <T extends { new(...args: any[]): AnyEntity<T> }>(target: T) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    meta.class = target;
    meta.name = target.name;
    meta.embeddable = true;

    return target;
  };
}
