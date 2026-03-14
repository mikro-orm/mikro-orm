import { Utils, ReferenceKind, type EntityProperty, type EntityKey, type PropertyOptions } from '@mikro-orm/core';
import { validateSingleDecorator, getMetadataFromDecorator } from '../utils.js';

/** Defines a scalar property on an entity (legacy TypeScript decorator). */
export function Property<T extends object>(
  options: PropertyOptions<T> = {},
): (target: T, propertyName: string) => void {
  return function (target: T, propertyName: string): void {
    const meta = getMetadataFromDecorator(target.constructor as T);
    const desc = Object.getOwnPropertyDescriptor(target, propertyName) || {};
    validateSingleDecorator(meta, propertyName, ReferenceKind.SCALAR);
    const name = options.name || propertyName;

    if (propertyName !== name && !(desc.value instanceof Function)) {
      Utils.renameKey(options, 'name', 'fieldName');
    }

    options.name = propertyName;
    const { check, ...opts } = options;
    const prop = { kind: ReferenceKind.SCALAR, ...opts } as EntityProperty<T>;
    prop.getter = !!desc.get;
    prop.setter = !!desc.set;

    if (desc.value instanceof Function) {
      prop.getter = true;
      prop.persist = false;
      prop.type = 'method';
      prop.getterName = propertyName as EntityKey<T>;
      prop.name = name as EntityKey<T>;
    }

    if (check) {
      meta.checks.push({ property: prop.name, expression: check });
    }

    meta.properties[prop.name] = prop;
  };
}
