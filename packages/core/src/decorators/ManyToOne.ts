import type { ReferenceOptions } from './Property.js';
import { MetadataStorage } from '../metadata/MetadataStorage.js';
import { MetadataValidator } from '../metadata/MetadataValidator.js';
import { Utils } from '../utils/Utils.js';
import { type DeferMode, ReferenceKind } from '../enums.js';
import type { AnyEntity, AnyString, EntityKey, EntityName, EntityProperty } from '../typings.js';

export function ManyToOne<T extends object, O>(
  entity: ManyToOneOptions<T, O> | string | ((e?: any) => EntityName<T>) = {},
  options: Partial<ManyToOneOptions<T, O>> = {},
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.processDecoratorParameters<ManyToOneOptions<T, O>>({ entity, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as T);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.MANY_TO_ONE);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_ONE } as EntityProperty;
    meta.properties[propertyName as EntityKey<T>] = Object.assign(meta.properties[propertyName as EntityKey<T>] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface ManyToOneOptions<Owner, Target> extends ReferenceOptions<Owner, Target> {
  /** Point to the inverse side property name. */
  inversedBy?: (string & keyof Target) | ((e: Target) => any);

  /** Wrap the entity in {@apilink Reference} wrapper. */
  ref?: boolean;

  /** Use this relation as a primary key. */
  primary?: boolean;

  /** Map this relation to the primary key value instead of an entity. */
  mapToPk?: boolean;

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  joinColumn?: string;

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  joinColumns?: string[];

  /** When a part of a composite column is shared in other properties, use this option to specify what columns are considered as owned by this property. This is useful when your composite property is nullable, but parts of it are not. */
  ownColumns?: string[];

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  referenceColumnName?: string;

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  referencedColumnNames?: string[];

  /** What to do when the target entity gets deleted. */
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** What to do when the reference to the target entity gets updated. */
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** Set the constraint type. Immediate constraints are checked for each statement, while deferred ones are only checked at the end of the transaction. Only for postgres unique constraints. */
  deferMode?: DeferMode | `${DeferMode}`;
}
