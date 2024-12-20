import { type DeferMode, ReferenceKind } from '../enums';
import { createOneToDecorator, type OneToManyOptions } from './OneToMany';
import type { AnyString, EntityName } from '../typings';

export function OneToOne<Target, Owner>(
  entity?: OneToOneOptions<Owner, Target> | string | ((e: Owner) => EntityName<Target>),
  mappedByOrOptions?: (string & keyof Target) | ((e: Target) => any) | Partial<OneToOneOptions<Owner, Target>>,
  options: Partial<OneToOneOptions<Owner, Target, any>> = {},
) {
  const mappedBy = typeof mappedByOrOptions === 'object' ? mappedByOrOptions.mappedBy : mappedByOrOptions;
  options = typeof mappedByOrOptions === 'object' ? { ...mappedByOrOptions, ...options } : options;
  return createOneToDecorator<Target, Owner>(entity as string, mappedBy, options, ReferenceKind.ONE_TO_ONE);
}

export interface OneToOneOptions<Owner, Target, ValueType = Target> extends Partial<Omit<OneToManyOptions<Owner, Target, ValueType>, 'orderBy'>> {
  /** Set this side as owning. Owning side is where the foreign key is defined. This option is not required if you use `inversedBy` or `mappedBy` to distinguish owning and inverse side. */
  owner?: boolean;

  /** Point to the inverse side property name. */
  inversedBy?: (string & keyof Target) | ((e: Target) => any);

  /** Wrap the entity in {@apilink Reference} wrapper. */
  ref?: boolean;

  /** Use this relation as a primary key. */
  primary?: boolean;

  /** Map this relation to the primary key value instead of an entity. */
  mapToPk?: boolean;

  /** What to do when the target entity gets deleted. */
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** What to do when the reference to the target entity gets updated. */
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** Set the constraint type. Immediate constraints are checked for each statement, while deferred ones are only checked at the end of the transaction. Only for postgres unique constraints. */
  deferMode?: DeferMode | `${DeferMode}`;
}
