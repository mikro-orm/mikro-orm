import { MetadataStorage } from '../metadata';
import { EntityManager } from '../EntityManager';
import { IPrimaryKey } from './PrimaryKey';
import { Cascade, Collection, EntityRepository, ReferenceType } from '../entity';
import { Utils } from '../utils';

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
  customRepository?: () => { new (em: EntityManager, entityName: string | EntityClass<IEntity>): EntityRepository<IEntity> };
}

export interface IEntity<K = number | string> {
  id: K;
  isInitialized(): boolean;
  populated(populated?: boolean): void;
  init(populated?: boolean): Promise<this>;
  toObject(parent?: IEntity, isCollection?: boolean): Record<string, any>;
  toJSON(): Record<string, any>;
  assign(data: any): void;
  uuid: string;
  __em: EntityManager;
  __initialized?: boolean;
  __populated: boolean;
}

export type IEntityType<T> = { [k in keyof T]: IEntity | Collection<IEntity> | any; } & IEntity;

export type EntityClass<T extends IEntityType<T>> = Function & { prototype: T };

export type EntityData<T extends IEntityType<T>> = { [P in keyof T]?: T[P] | IPrimaryKey; } & Record<string, any>;

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
  hooks: Record<string, string[]>;
  prototype: EntityClass<T> & IEntity;
}
