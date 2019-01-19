import { getMetadataStorage } from './MikroORM';
import { Collection } from './Collection';
import { IEntity, ReferenceType } from './decorators/Entity';

export abstract class BaseEntity {

  constructor() {
    const metadata = getMetadataStorage();
    const meta = metadata[this.constructor.name];
    const props = meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        this[prop] = new Collection(this);
      }
    });
  }

}

export interface BaseEntity extends IEntity { }
