import { QueryOrder } from './query';
import { AssignOptions, Cascade, Collection, EntityRepository, EntityValidator, IdentifiedReference, Reference, ReferenceType } from './entity';
import { EntityManager } from './EntityManager';
import { LockMode } from './unit-of-work';
import { Platform } from './platforms';
import { MetadataStorage } from './metadata';
import { Type } from './types';

export type Constructor<T> = new (...args: any[]) => T;
export type Dictionary<T = any> = { [k: string]: T };

export type PartialEntityProperty<T, P extends keyof T> = null | (T extends Date | RegExp ? T : T[P] | (true extends IsEntity<T[P]> ? PartialEntity<T[P]> | Primary<T[P]> : never));
export type PartialEntity<T> = T extends Reference<infer U> ? { [P in keyof U]?: PartialEntityProperty<U, P> } : { [P in keyof T]?: PartialEntityProperty<T, P> };

export type DeepPartialEntity<T> = {
  [P in keyof T]?: null | (T[P] extends (infer U)[]
    ? DeepPartialEntity<U>[]
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartialEntity<U>>
      : T extends Date | RegExp
        ? T
        : DeepPartialEntity<T[P]> | PartialEntity<T[P]> | Primary<T[P]>)
};

export const PrimaryKeyType = Symbol('PrimaryKeyType');
export type Primary<T> = T extends { [PrimaryKeyType]: infer PK }
  ? PK : T extends { _id: infer PK }
  ? PK | string : T extends { uuid: infer PK }
  ? PK : T extends { id: infer PK }
  ? PK : never;
export type IPrimaryKeyValue = number | string | { toHexString(): string };
export type IPrimaryKey<T extends IPrimaryKeyValue = IPrimaryKeyValue> = T;

export type IsEntity<T> = T extends Reference<T> | { [PrimaryKeyType]: any } | { _id: any } | { uuid: string } | { id: number | string } ? true : never;

export type UnionOfArrays<T> = T extends infer T1 | infer T2 | infer T3 | infer T4 | infer T5 | infer T6 | infer T7 | infer T8 | infer T9 | infer T10
  ? T1[] | T2[] | T3[] | T4[] | T5[] | T6[] | T7[] | T8[] | T9[] | T10[] : T extends infer T1 | infer T2 | infer T3 | infer T4 | infer T5 | infer T6 | infer T7 | infer T8 | infer T9
  ? T1[] | T2[] | T3[] | T4[] | T5[] | T6[] | T7[] | T8[] | T9[] : T extends infer T1 | infer T2 | infer T3 | infer T4 | infer T5 | infer T6 | infer T7 | infer T8
  ? T1[] | T2[] | T3[] | T4[] | T5[] | T6[] | T7[] | T8[] : T extends infer T1 | infer T2 | infer T3 | infer T4 | infer T5 | infer T6 | infer T7
  ? T1[] | T2[] | T3[] | T4[] | T5[] | T6[] | T7[] : T extends infer T1 | infer T2 | infer T3 | infer T4 | infer T5 | infer T6
  ? T1[] | T2[] | T3[] | T4[] | T5[] | T6[] : T extends infer T1 | infer T2 | infer T3 | infer T4 | infer T5
  ? T1[] | T2[] | T3[] | T4[] | T5[] : T extends infer T1 | infer T2 | infer T3 | infer T4
  ? T1[] | T2[] | T3[] | T4[] : T extends infer T1 | infer T2 | infer T3
  ? T1[] | T2[] | T3[] : T extends infer T1 | infer T2
  ? T1[] | T2[] : T extends infer T1
  ? T1[] : never;
export type OneOrArray<T> = T | UnionOfArrays<T>;
export type GroupOperatorMap<T> = { $and?: UnionOfArrays<Query<T>>; $or?: UnionOfArrays<Query<T>> };
export type OperatorMap<T> = {
  $and?: Query<T>[];
  $or?: Query<T>[];
  $eq?: Query<T>;
  $ne?: Query<T>;
  $in?: Query<T>[];
  $nin?: Query<T>[];
  $not?: Query<T>;
  $gt?: Query<T>;
  $gte?: Query<T>;
  $lt?: Query<T>;
  $lte?: Query<T>;
  $like?: string;
  $re?: string;
};
export type StringProp<T> = T extends string ? string | RegExp : never;
export type EntityOrPrimary<T> = true extends IsEntity<T> ? DeepPartialEntity<T> | PartialEntity<T> | Primary<T> | T : never;
export type CollectionItem<T> = T extends Collection<infer K> ? EntityOrPrimary<K> : never;
export type FilterValue<T> = T | OperatorMap<T> | StringProp<T> | OneOrArray<CollectionItem<T> | EntityOrPrimary<T>> | null;
export type Query<T> = true extends IsEntity<T>
  ? { [K in keyof T]?: Query<T[K]> | FilterValue<T[K]> | null } | FilterValue<T>
  : T extends Collection<infer K>
    ? { [KK in keyof K]?: Query<K[KK]> | FilterValue<K[KK]> | null } | FilterValue<K>
    : FilterValue<T>;
export type FilterQuery<T> = GroupOperatorMap<Query<T>> | Query<T> | { [PrimaryKeyType]?: any };

export interface IWrappedEntity<T, PK extends keyof T> {
  isInitialized(): boolean;
  populated(populated?: boolean): void;
  init(populated?: boolean, lockMode?: LockMode): Promise<this>;
  toReference(): IdentifiedReference<T, PK>;
  toObject(ignoreFields?: string[]): Dictionary;
  toJSON(...args: any[]): Dictionary;
  assign(data: any, options?: AssignOptions | boolean): this;
  __uuid: string;
  __meta: EntityMetadata<T>;
  __internal: { platform: Platform; metadata: MetadataStorage; validator: EntityValidator };
  __em?: EntityManager;
  __initialized?: boolean;
  __populated: boolean;
  __lazyInitialized: boolean;
  __primaryKey: T[PK] & Primary<T>;
  __serializedPrimaryKey: string & keyof T;
}

export type AnyEntity<T = any, PK extends keyof T = keyof T> = { [K in PK]?: T[K] } & { [PrimaryKeyType]?: T[PK] };
export type WrappedEntity<T, PK extends keyof T> = IWrappedEntity<T, PK> & AnyEntity<T, PK>;
export type IdEntity<T extends { id: number | string }> = AnyEntity<T, 'id'>;
export type UuidEntity<T extends { uuid: string }> = AnyEntity<T, 'uuid'>;
export type MongoEntity<T extends { _id: IPrimaryKey; id: string }> = AnyEntity<T, 'id' | '_id'>;
export type EntityClass<T extends AnyEntity<T>> = Function & { prototype: T };
export type EntityClassGroup<T extends AnyEntity<T>> = { entity: EntityClass<T>; schema: EntityMetadata<T> };
export type EntityName<T extends AnyEntity<T>> = string | EntityClass<T>;
export type EntityData<T extends AnyEntity<T>> = { [K in keyof T]?: T[K] | Primary<T[K]> | CollectionItem<T[K]>[] } & Dictionary;

export interface EntityProperty<T extends AnyEntity<T> = any> {
  name: string & keyof T;
  entity: () => EntityName<T>;
  type: string;
  columnType: string;
  customType: Type;
  primary: boolean;
  length?: any;
  reference: ReferenceType;
  wrappedReference?: boolean;
  fieldName: string;
  default?: any;
  index?: boolean | string;
  unique?: boolean | string;
  nullable?: boolean;
  unsigned: boolean;
  persist?: boolean;
  hidden?: boolean;
  enum?: boolean;
  items?: (number | string)[];
  version?: boolean;
  eager?: boolean;
  setter?: boolean;
  getter?: boolean;
  getterName?: keyof T;
  cascade: Cascade[];
  orphanRemoval?: boolean;
  onUpdate?: () => any;
  owner: boolean;
  inversedBy: string;
  mappedBy: string;
  orderBy?: { [field: string]: QueryOrder };
  fixedOrder?: boolean;
  fixedOrderColumn?: string;
  pivotTable: string;
  joinColumn: string;
  inverseJoinColumn: string;
  referenceColumnName: string;
  referencedTableName: string;
}

export type HookType = 'onInit' | 'beforeCreate' | 'afterCreate' | 'beforeUpdate' | 'afterUpdate' | 'beforeDelete' | 'afterDelete';

export interface EntityMetadata<T extends AnyEntity<T> = any> {
  name: string;
  className: string;
  pivotTable: boolean;
  constructorParams: (keyof T & string)[];
  toJsonParams: string[];
  extends: string;
  collection: string;
  path: string;
  primaryKey: keyof T & string;
  primaryKeys: (keyof T & string)[];
  compositePK: boolean;
  versionProperty: keyof T & string;
  serializedPrimaryKey: keyof T & string;
  properties: { [K in keyof T & string]: EntityProperty<T> };
  indexes: { properties: string | string[]; name?: string; type?: string }[];
  uniques: { properties: string | string[]; name?: string }[];
  customRepository: () => Constructor<EntityRepository<T>>;
  hooks: Partial<Record<HookType, (string & keyof T)[]>>;
  prototype: T;
  class: Constructor<T>;
}
