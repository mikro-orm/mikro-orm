import { type DeferMode, ReferenceKind } from '../enums.js';
import { createOneToDecorator, type OneToManyOptions } from './OneToMany.js';
import type { AnyString, EntityName } from '../typings.js';

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

  /** When a part of a composite column is shared in other properties, use this option to specify what columns are considered as owned by this property. This is useful when your composite property is nullable, but parts of it are not. */
  ownColumns?: string[];

  /** What to do when the target entity gets deleted. */
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** What to do when the reference to the target entity gets updated. */
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** Set the constraint type. Immediate constraints are checked for each statement, while deferred ones are only checked at the end of the transaction. Only for postgres unique constraints. */
  deferMode?: DeferMode | `${DeferMode}`;
}
