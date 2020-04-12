import { Collection, AnyEntity, MetadataStorage, ReferenceType } from '@mikro-orm/core';

export abstract class BaseEntity22 {

  abstract id: number;

  constructor() {
    const meta = MetadataStorage.getMetadata(this.constructor.name);
    const props = meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        (this as any)[prop] = new Collection(this as AnyEntity);
      }
    });
  }

}
