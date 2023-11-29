import { ReferenceKind } from '../enums';
import { createOneToDecorator, type OneToManyOptions } from './OneToMany';
import type { AnyString, Dictionary, EntityName } from '../typings';

export function OneToOne<Target, Owner>(
  entity?: OneToOneOptions<Owner, Target> | string | ((e: Owner) => EntityName<Target>),
  mappedByOrOptions?: (string & keyof Target) | ((e: Target) => any) | Partial<OneToOneOptions<Owner, Target>>,
  options: Partial<OneToOneOptions<Owner, Target>> = {},
) {
  const mappedBy = typeof mappedByOrOptions === 'object' ? mappedByOrOptions.mappedBy : mappedByOrOptions;
  options = typeof mappedByOrOptions === 'object' ? { ...mappedByOrOptions, ...options } : options;
  return createOneToDecorator<Target, Owner>(entity as string, mappedBy, options, ReferenceKind.ONE_TO_ONE);
}

export interface OneToOneOptions<Owner, Target> extends Partial<Omit<OneToManyOptions<Owner, Target>, 'orderBy'>> {
  owner?: boolean;
  inversedBy?: (string & keyof Target) | ((e: Target) => any);
  ref?: boolean;
  primary?: boolean;
  mapToPk?: boolean;
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
}
