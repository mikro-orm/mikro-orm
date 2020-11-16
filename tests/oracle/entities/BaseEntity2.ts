import { AnyEntity, Collection, ReferenceType, wrap } from '@mikro-orm/core';

export abstract class BaseEntity2 {

  abstract id: number;

  constructor() {
    const props = wrap(this, true).__meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        (this as any)[prop] = new Collection(this as AnyEntity);
      }
    });
  }

}
