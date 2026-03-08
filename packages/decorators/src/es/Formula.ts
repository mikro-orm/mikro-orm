import {
  type EntityKey,
  type EntityProperty,
  type FormulaCallback,
  type PropertyOptions,
  ReferenceKind,
} from '@mikro-orm/core';
import { prepareMetadataContext } from '../utils.js';

export function Formula<Owner extends object>(
  formula: string | FormulaCallback<Owner>,
  options: PropertyOptions<Owner> = {},
): (value: unknown, context: ClassFieldDecoratorContext<Owner>) => void {
  return function (value: unknown, context: ClassFieldDecoratorContext<Owner>): void {
    const meta = prepareMetadataContext(context);
    meta.properties[context.name as EntityKey<Owner>] = {
      name: context.name,
      kind: ReferenceKind.SCALAR,
      formula,
      ...options,
    } as EntityProperty<Owner>;
  };
}
