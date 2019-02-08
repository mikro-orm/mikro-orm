import { merge } from 'lodash';
import { Utils } from '../utils/Utils';
import { MetadataStorage } from '../metadata/MetadataStorage';

export function Entity(options: EntityOptions = {}): Function {
  return function <T extends { new(...args: any[]): IEntity }>(target: T) {
    const storage = MetadataStorage.getMetadata(target.name);
    const meta = merge(storage[target.name], options);
    meta.name = target.name;
    meta.constructorParams = Utils.getParamNames(target);
    meta.extends = Object.getPrototypeOf(target).name || undefined;

    return target;
  };
}

export type EntityOptions = {
  collection?: string;
  customRepository?: any;
}

export interface IEntity<T = number | string> {
  id: T;
  isInitialized(): boolean;
  populated(populated?: boolean): void;
  init(populated?): Promise<IEntity>;
  toObject(parent?: IEntity, isCollection?: boolean): { [field: string]: any };
  toJSON(): { [field: string]: any };
  assign(data: any): void;
}

export enum ReferenceType {
  SCALAR = 0,
  MANY_TO_ONE = 1,
  ONE_TO_MANY = 2,
  MANY_TO_MANY = 3,
}

export enum Cascade {
  PERSIST = 0,
  REMOVE = 1,
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

export interface EntityMetadata {
  name: string;
  constructorParams: string[];
  extends: string;
  collection: string;
  path: string;
  primaryKey: string;
  properties: { [property: string]: EntityProperty };
  customRepository: any;
  hooks: { [type: string]: string[] };
  prototype: Function;
}
