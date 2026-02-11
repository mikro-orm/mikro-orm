import {
  type EntityKey,
  type EntityProperty,
  type PropertyOptions,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';
import { prepareMetadataContext } from '../utils.js';

export function Property<T extends object>(options: PropertyOptions<T> = {}) {
  return function (value: unknown, context: ClassFieldDecoratorContext<T> | ClassGetterDecoratorContext<T> | ClassSetterDecoratorContext<T> | ClassAccessorDecoratorContext<T> | ClassMethodDecoratorContext<T>) {
    const meta = prepareMetadataContext(context, ReferenceKind.SCALAR);
    const { check, ...opts } = options;
    const prop = { kind: ReferenceKind.SCALAR, ...opts } as EntityProperty<T>;
    const name = options.name ?? context.name;
    meta.checks ??= [];

    if (context.name !== name) {
      Utils.renameKey(options, 'name', 'fieldName');
    }

    if (context.kind === 'field') {
      prop.name = context.name as EntityKey<T>;
      prop.getter = false;
      prop.setter = false;
    } else if (context.kind === 'getter') {
      prop.name = context.name as EntityKey<T>;
      prop.getter = true;
      prop.setter = false;
    } else if (context.kind === 'setter') {
      prop.name = context.name as EntityKey<T>;
      prop.getter = false;
      prop.setter = true;
    } else if (context.kind === 'accessor') {
      prop.name = context.name as EntityKey<T>;
      prop.getter = true;
      prop.setter = true;
    } else if (context.kind === 'method') {
      prop.getter = true;
      prop.persist = false;
      prop.type = 'method';
      prop.getterName = context.name as keyof T;
      prop.name = name as EntityKey<T>;
    }

    if (check) {
      meta.checks.push({ property: prop.name, expression: check });
    }

    meta.properties![prop.name] = prop;
  };
}
