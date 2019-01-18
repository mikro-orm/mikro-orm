import { getMetadataStorage } from './MikroORM';
import { Collection } from './Collection';
import { IEntity } from './decorators/Entity';

export abstract class BaseEntity {

  constructor() {
    const metadata = getMetadataStorage();
    const meta = metadata[this.constructor.name];
    const props = meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        this[prop] = new Collection(this, prop, []);
      }
    });
  }

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
  properties: { [property: string]: EntityProperty };
  customRepository: any;
  hooks: { [type: string]: string[] };
}

export interface BaseEntity extends IEntity { }
