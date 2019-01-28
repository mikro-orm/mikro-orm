import { merge } from 'lodash';
import { getMetadataStorage } from '../MikroORM';
import { Utils } from '../Utils';
import { Collection } from '../Collection';
import { IPrimaryKey } from './PrimaryKey';
import { EntityManager } from '../EntityManager';

export function Entity(options: EntityOptions = {}): Function {
  return function <T extends { new(...args: any[]): IEntity }>(target: T) {
    const storage = getMetadataStorage(target.name);
    const meta = merge(storage[target.name], options);
    meta.name = target.name;
    meta.constructorParams = Utils.getParamNames(target);

    return target;
  };
}

export type EntityOptions = {
  collection?: string;
  customRepository?: any;
}

export interface IEntity {
  id: IPrimaryKey;
  isInitialized(): boolean;
  shouldPopulate(collection?: Collection<IEntity>): boolean;
  populated(populated?: boolean): void;
  init(populated?, em?: EntityManager): Promise<IEntity>;
  toJSON(): any;
  toObject(parent?: IEntity, collection?: Collection<IEntity>): any;
  assign(data: any, em?: EntityManager): void;
}

export enum ReferenceType {
  SCALAR = 0,
  MANY_TO_ONE = 1,
  ONE_TO_MANY = 2,
  MANY_TO_MANY = 3,
}

export interface EntityProperty {
  name: string;
  fk: string;
  entity: () => string | Function;
  type: string;
  reference: ReferenceType;
  fieldName?: string;
  attributes?: { [attribute: string]: any };
  onUpdate?: () => any;
  owner?: boolean;
  inversedBy?: string;
  mappedBy?: string;
  pivotTable?: string;
  joinColumn?: string;
  inverseJoinColumn?: string;
  referenceColumnName?: string;
}

export interface EntityMetadata {
  name: string;
  constructorParams: string[];
  collection: string;
  path: string;
  primaryKey: string;
  properties: { [property: string]: EntityProperty };
  customRepository: any;
  hooks: { [type: string]: string[] };
}
