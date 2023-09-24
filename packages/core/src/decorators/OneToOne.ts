import { ReferenceKind } from '../enums';
import { createOneToDecorator, type OneToManyOptions } from './OneToMany';
import type { AnyString, EntityName } from '../typings';

export function OneToOne<T, O>(
  entity?: OneToOneOptions<T, O> | string | ((e?: any) => EntityName<T>),
  mappedByOrOptions?: (string & keyof T) | ((e: T) => any) | Partial<OneToOneOptions<T, O>>,
  options: Partial<OneToOneOptions<T, O>> = {},
) {
  const mappedBy = typeof mappedByOrOptions === 'object' ? mappedByOrOptions.mappedBy : mappedByOrOptions;
  options = typeof mappedByOrOptions === 'object' ? { ...mappedByOrOptions, ...options } : options;
  return createOneToDecorator<T, O>(entity as string, mappedBy, options, ReferenceKind.ONE_TO_ONE);
}

export interface OneToOneOptions<T, O> extends Partial<Omit<OneToManyOptions<T, O>, 'orderBy'>> {
  owner?: boolean;
  inversedBy?: (string & keyof T) | ((e: T) => any);
  ref?: boolean;
  primary?: boolean;
  mapToPk?: boolean;
  onDelete?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  onUpdateIntegrity?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
}
