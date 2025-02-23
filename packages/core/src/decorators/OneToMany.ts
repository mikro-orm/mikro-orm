import type { ReferenceOptions } from './Property.js';
import { MetadataStorage } from '../metadata/MetadataStorage.js';
import { MetadataValidator } from '../metadata/MetadataValidator.js';
import { Utils } from '../utils/Utils.js';
import { ReferenceKind, type QueryOrderMap } from '../enums.js';
import type { EntityName, EntityProperty, EntityKey, FilterQuery } from '../typings.js';

export function createOneToDecorator<Target, Owner>(
  entity: OneToManyOptions<Owner, Target> | string | ((e?: any) => EntityName<Target>),
  mappedBy: (string & keyof Target) | ((e: Target) => any) | undefined,
  options: Partial<OneToManyOptions<Owner, Target>>,
  kind: ReferenceKind,
) {
  return function (target: Owner, propertyName: string) {
    options = Utils.processDecoratorParameters<OneToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const meta = MetadataStorage.getMetadataFromDecorator((target as any).constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName, kind);
    const property = { name: propertyName, kind } as EntityProperty<Target>;
    meta.properties[propertyName as EntityKey<Target>] = Object.assign(meta.properties[propertyName as EntityKey<Target>] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export function OneToMany<Target, Owner>(
  entity: string | ((e?: any) => EntityName<Target>),
  mappedBy: (string & keyof Target) | ((e: Target) => any),
  options?: Partial<OneToManyOptions<Owner, Target>>,
): (target: Owner, propertyName: string) => void;
export function OneToMany<Target, Owner>(
  options: OneToManyOptions<Owner, Target>,
): (target: Owner, propertyName: string) => void;
export function OneToMany<Target, Owner>(
  entity: OneToManyOptions<Owner, Target> | string | ((e?: any) => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<OneToManyOptions<Owner, Target>> = {},
): (target: Owner, propertyName: string) => void {
  return createOneToDecorator(entity, mappedBy, options, ReferenceKind.ONE_TO_MANY);
}

export interface OneToManyOptions<Owner, Target> extends ReferenceOptions<Owner, Target> {
  /** Remove the entity when it gets disconnected from the relationship (see {@doclink cascading | Cascading}). */
  orphanRemoval?: boolean;

  /** Set default ordering. */
  orderBy?: QueryOrderMap<Target> | QueryOrderMap<Target>[];

  /** Condition for {@doclink collections#declarative-partial-loading | Declarative partial loading}. */
  where?: FilterQuery<Target>;

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

  /** Point to the owning side property name. */
  mappedBy: (string & keyof Target) | ((e: Target) => any);
}
