import { EntityName, IEntityType } from './Entity';
import { ReferenceType } from '../entity';
import { createOneToDecorator, OneToManyOptions } from './OneToMany';

export function OneToOne<T extends IEntityType<T>>(
  entity?: OneToOneOptions<T> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<OneToOneOptions<T>> = {},
) {
  return createOneToDecorator<T>(entity as string, mappedBy, options, ReferenceType.ONE_TO_ONE);
}

export interface OneToOneOptions<T extends IEntityType<T>> extends Partial<Omit<OneToManyOptions<T>, 'orderBy'>> {
  owner?: boolean;
  inversedBy?: (string & keyof T) | ((e: T) => any);
  wrappedReference?: boolean;
}
