import { ReferenceType } from '../enums';
import { createOneToDecorator, OneToManyOptions } from './OneToMany';
import { EntityName } from '../typings';

export function OneToOne<T, O>(
  entity?: OneToOneOptions<T, O> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<OneToOneOptions<T, O>> = {},
) {
  return createOneToDecorator<T, O>(entity as string, mappedBy, options, ReferenceType.ONE_TO_ONE);
}

export interface OneToOneOptions<T, O> extends Partial<Omit<OneToManyOptions<T, O>, 'orderBy'>> {
  owner?: boolean;
  inversedBy?: (string & keyof T) | ((e: T) => any);
  wrappedReference?: boolean;
  primary?: boolean;
  onDelete?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
  onUpdateIntegrity?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
}
