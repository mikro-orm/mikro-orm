import { MetadataStorage } from '../metadata/MetadataStorage.js';
import { Utils } from '../utils/Utils.js';
import type { AnyString, Constructor, Dictionary, EntityClass, ObjectQuery } from '../typings.js';
import type { FindOptions } from '../drivers/IDatabaseDriver.js';

export function Entity<T extends EntityClass<unknown>>(options: EntityOptions<T> = {}) {
  return function (target: T) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    Utils.mergeConfig(meta, options);
    meta.class = target;

    if (!options.abstract || meta.discriminatorColumn) {
      meta.name = target.name;
    }
  };
}

export type EntityOptions<T, E = T extends EntityClass<infer P> ? P : T> = {
  /** Override default collection/table name. Alias for `collection`. */
  tableName?: string;
  /** Sets the schema name. */
  schema?: string;
  /** Override default collection/table name. Alias for `tableName`. */
  collection?: string;
  /** For {@doclink inheritance-mapping#single-table-inheritance | Single Table Inheritance}. */
  discriminatorColumn?: (T extends EntityClass<infer P> ? keyof P : string) | AnyString;
  /** For {@doclink inheritance-mapping#single-table-inheritance | Single Table Inheritance}. */
  discriminatorMap?: Dictionary<string>;
  /** For {@doclink inheritance-mapping#single-table-inheritance | Single Table Inheritance}. */
  discriminatorValue?: number | string;
  /**	Enforce use of constructor when creating managed entity instances. */
  forceConstructor?: boolean;
  /** Specify comment to table. (SQL only) */
  comment?: string;
  /**	Marks entity as abstract, such entities are inlined during discovery. */
  abstract?: boolean;
  /** Disables change tracking - such entities are ignored during flush. */
  readonly?: boolean;
  /** Marks entity as {@doclink virtual-entities | virtual}. This is set automatically when you use `expression` option. */
  virtual?: boolean;
  /** Used to make ORM aware of externally defined triggers. This is needed for MS SQL Server multi inserts, ignored in other dialects. */
  hasTriggers?: boolean;
  // we need to use `em: any` here otherwise an expression would not be assignable with more narrow type like `SqlEntityManager`
  // also return type is unknown as it can be either QB instance (which we cannot type here) or array of POJOs (e.g. for mongodb)
  /** SQL query that maps to a {@doclink virtual-entities | virtual entity}. */
  expression?: string | ((em: any, where: ObjectQuery<E>, options: FindOptions<E, any, any, any>) => object);
  /** Set {@doclink repositories#custom-repository | custom repository class}. */
  repository?: () => Constructor;
};
