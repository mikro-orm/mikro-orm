import { Utils } from '../utils/Utils';
import { MetadataStorage } from '../metadata/MetadataStorage';
import { EntityManager } from '../EntityManager';
import { Collection } from '../Collection';
import { EntityRepository } from '../EntityRepository';
import { IPrimaryKey } from './PrimaryKey';

export function Entity(options: EntityOptions = {}): Function {
  return function <T extends { new(...args: any[]): IEntity }>(target: T) {
    const meta = MetadataStorage.getMetadata(target.name);
    Utils.merge(meta, options);
    meta.name = target.name;
    meta.constructorParams = Utils.getParamNames(target);
    meta.extends = Object.getPrototypeOf(target).name || undefined;

    return target;
  };
}

export type EntityOptions = {
  collection?: string;
  customRepository?: () => { new (em: EntityManager, entityName: string): EntityRepository<IEntity> };
}

export interface IEntity<K = number | string> {
  id: K;
  isInitialized(): boolean;
  populated(populated?: boolean): void;
  init(populated?: boolean): Promise<this>;
  toObject(parent?: IEntity, isCollection?: boolean): { [field: string]: any };
  toJSON(): { [field: string]: any };
  assign(data: any): void;
  uuid: string;
  __em: EntityManager;
  __initialized?: boolean;
  __populated: boolean;
}

export type IEntityType<T> = {
  [k in keyof T]: IEntity | Collection<IEntity> | any;
} & IEntity;

export type EntityClass<T extends IEntityType<T>> = {
  new(...args: any[]): T;
}

export type EntityData<T extends IEntityType<T>> = {
  [P in keyof T]?: T[P] | IPrimaryKey;
} & { [key: string]: any; };

export enum ReferenceType {
  SCALAR = 'scalar',
  MANY_TO_ONE = 'm:1',
  ONE_TO_MANY = '1:m',
  MANY_TO_MANY = 'm:n',
}

export enum Cascade {
  PERSIST = 'persist',
  REMOVE = 'remove',
}

export interface EntityProperty {
  name: string;
  fk: string;
  entity: () => string | Function;
  type: string;
  primary: boolean;
  reference: ReferenceType;
  fieldName: string;
  cascade: Cascade[];
  onUpdate?: () => any;
  owner: boolean;
  inversedBy: string;
  mappedBy: string;
  pivotTable: string;
  joinColumn: string;
  inverseJoinColumn: string;
  referenceColumnName: string;
}

export interface EntityMetadata<T extends IEntityType<T> = any> {
  name: string;
  constructorParams: (keyof T & string)[];
  extends: string;
  collection: string;
  path: string;
  primaryKey: keyof T & string;
  properties: { [K in keyof T & string]: EntityProperty };
  customRepository: () => { new (em: EntityManager, entityName: string | EntityClass<T>): EntityRepository<T> };
  hooks: { [type: string]: string[] };
  prototype: EntityClass<T> & IEntity;
}
