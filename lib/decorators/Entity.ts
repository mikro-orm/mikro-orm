import { MetadataStorage } from '../metadata';
import { EntityManager } from '../EntityManager';
import { IPrimaryKey } from './PrimaryKey';
import { AssignOptions, Cascade, Collection, EntityRepository, ReferenceType } from '../entity';
import { Utils } from '../utils';
import { QueryOrder } from '../query';

export function Entity(options: EntityOptions = {}): Function {
  return function <T extends { new(...args: any[]): IEntity }>(target: T) {
    const meta = MetadataStorage.getMetadata(target.name);
    Utils.merge(meta, options);
    meta.name = target.name;
    meta.constructorParams = Utils.getParamNames(target);
    meta.extends = Object.getPrototypeOf(target).name || undefined;
    Utils.lookupPathFromDecorator(meta);

    return target;
  };
}

export type EntityOptions = {
  collection?: string;
  customRepository?: () => { new (em: EntityManager, entityName: EntityName<IEntity>): EntityRepository<IEntity> };
}

export interface IEntity<K = number | string> {
  id: K;
  isInitialized(): boolean;
  populated(populated?: boolean): void;
  init(populated?: boolean): Promise<this>;
  toObject(ignoreFields?: string[]): Record<string, any>;
  toJSON(...args: any[]): Record<string, any>;
  assign(data: any, options?: AssignOptions | boolean): void;
  __uuid: string;
  __em: EntityManager;
  __initialized?: boolean;
  __populated: boolean;
  __lazyInitialized: boolean;
  __primaryKey: K;
  __primaryKeyField: string & keyof IEntity;
  __serializedPrimaryKey: string & keyof IEntity;
  __serializedPrimaryKeyField: string;
}

export type IEntityType<T> = { [k in keyof T]: IEntity | Collection<IEntity> | any; } & IEntity;

export type EntityClass<T extends IEntityType<T>> = Function & { prototype: T };

export type EntityClassGroup<T extends IEntityType<T>> = {
  entity: EntityClass<T>
  schema: EntityMetadata<T>,
};

export type EntityName<T extends IEntityType<T>> = string | EntityClass<T>;

export type EntityData<T extends IEntityType<T>> = { [P in keyof T]?: T[P] | IPrimaryKey; } & Record<string, any>;

export interface EntityProperty<T extends IEntityType<T> = any> {
  name: string & keyof T;
  fk: string;
  entity: () => EntityName<T>;
  type: string;
  primary: boolean;
  length?: any;
  reference: ReferenceType;
  fieldName: string;
  default?: string;
  unique?: boolean;
  nullable?: boolean;
  persist?: boolean;
  hidden?: boolean;
  cascade: Cascade[];
  orphanRemoval?: boolean;
  onUpdate?: () => any;
  owner: boolean;
  inversedBy: string;
  mappedBy: string;
  orderBy?: { [field: string]: QueryOrder },
  pivotTable: string;
  joinColumn: string;
  inverseJoinColumn: string;
  referenceColumnName: string;
}

export interface EntityMetadata<T extends IEntityType<T> = any> {
  name: string;
  constructorParams: (keyof T & string)[];
  toJsonParams: string[];
  extends: string;
  collection: string;
  path: string;
  primaryKey: keyof T & string;
  serializedPrimaryKey: keyof T & string;
  properties: { [K in keyof T & string]: EntityProperty<T> };
  customRepository: () => { new (em: EntityManager, entityName: EntityName<T>): EntityRepository<T> };
  hooks: Record<string, string[]>;
  prototype: EntityClass<T> & IEntity;
}
