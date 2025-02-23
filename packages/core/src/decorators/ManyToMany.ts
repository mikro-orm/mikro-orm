import type { ReferenceOptions } from './Property.js';
import { MetadataStorage } from '../metadata/MetadataStorage.js';
import { MetadataValidator } from '../metadata/MetadataValidator.js';
import { Utils } from '../utils/Utils.js';
import type { EntityName, EntityProperty, EntityKey, FilterQuery, AnyString } from '../typings.js';
import { ReferenceKind, type QueryOrderMap } from '../enums.js';

export function ManyToMany<Target extends object, Owner extends object>(
  entity?: ManyToManyOptions<Owner, Target> | string | (() => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<ManyToManyOptions<Owner, Target>> = {},
) {
  return function (target: Owner, propertyName: keyof Owner) {
    options = Utils.processDecoratorParameters<ManyToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as Owner);
    MetadataValidator.validateSingleDecorator(meta, propertyName as string, ReferenceKind.MANY_TO_MANY);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_MANY } as EntityProperty<Owner, Target>;
    meta.properties[propertyName as EntityKey<Owner>] = Object.assign(meta.properties[propertyName as EntityKey<Owner>] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface ManyToManyOptions<Owner, Target> extends ReferenceOptions<Owner, Target> {
  /** Set this side as owning. Owning side is where the foreign key is defined. This option is not required if you use `inversedBy` or `mappedBy` to distinguish owning and inverse side. */
  owner?: boolean;

  /** Point to the inverse side property name. */
  inversedBy?: (string & keyof Target) | ((e: Target) => any);

  /** Point to the owning side property name. */
  mappedBy?: (string & keyof Target) | ((e: Target) => any);

  /** Condition for {@doclink collections#declarative-partial-loading | Declarative partial loading}. */
  where?: FilterQuery<Target>;

  /** Set default ordering. */
  orderBy?: QueryOrderMap<Target> | QueryOrderMap<Target>[];

  /** Force stable insertion order of items in the collection (see {@doclink collections | Collections}). */
  fixedOrder?: boolean;

  /** Override default order column name (`id`) for fixed ordering. */
  fixedOrderColumn?: string;

  /** Override default name for pivot table (see {@doclink naming-strategy | Naming Strategy}). */
  pivotTable?: string;

  /** Set pivot entity for this relation (see {@doclink collections#custom-pivot-table-entity | Custom pivot table entity}). */
  pivotEntity?: string | (() => EntityName<any>);

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  joinColumn?: string;

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  joinColumns?: string[];

  /** Override the default database column name on the inverse side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  inverseJoinColumn?: string;

  /** Override the default database column name on the inverse side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  inverseJoinColumns?: string[];

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  referenceColumnName?: string;

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  referencedColumnNames?: string[];

  /** What to do when the target entity gets deleted. */
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** What to do when the reference to the target entity gets updated. */
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
}
