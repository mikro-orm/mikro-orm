import {
  type EnumOptions,
  ReferenceKind,
  type AnyEntity,
  type Dictionary,
  type EntityProperty,
  type EntityKey,
} from '@mikro-orm/core';
import { prepareMetadataContext } from '../utils.js';

export function Enum<Owner extends object>(
  options: EnumOptions<AnyEntity> | (() => Dictionary) = {},
): (target: unknown, context: ClassFieldDecoratorContext<Owner>) => void {
  return function (target: unknown, context: ClassFieldDecoratorContext<Owner>): void {
    const meta = prepareMetadataContext(context);
    options = options instanceof Function ? { items: options } : options;
    meta.properties[context.name as EntityKey<Owner>] = {
      name: context.name,
      kind: ReferenceKind.SCALAR,
      enum: true,
      ...options,
    } as EntityProperty<Owner>;
  };
}
