import type { AnyEntity } from '@mikro-orm/core';
import { Collection, ReferenceKind, wrap } from '@mikro-orm/core';

export abstract class BaseEntity22 {

  abstract id: number;

  constructor() {
    const props = wrap(this, true).__meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(props[prop].reference)) {
        (this as any)[prop] = new Collection(this as AnyEntity);
      }
    });
  }

}
