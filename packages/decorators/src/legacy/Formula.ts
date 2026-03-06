import {
  type EntityKey,
  type EntityProperty,
  type FormulaCallback,
  type PropertyOptions,
  ReferenceKind,
} from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

export function Formula<T extends object>(
  formula: string | FormulaCallback<T>,
  options: PropertyOptions<T> = {},
): (target: T, propertyName: string) => void {
  return function (target: T, propertyName: string): void {
    const meta = getMetadataFromDecorator(target.constructor as T);
    meta.properties[propertyName as EntityKey<T>] = {
      name: propertyName,
      kind: ReferenceKind.SCALAR,
      formula,
      ...options,
    } as EntityProperty<T>;
  };
}
