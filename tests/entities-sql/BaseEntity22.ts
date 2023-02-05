import type { AnyEntity } from '@mikro-orm/core';
import { Collection, ReferenceKind, Utils, wrap } from '@mikro-orm/core';

export abstract class BaseEntity22 {

  abstract id: number;

  constructor() {
    const props = wrap(this, true).__meta.properties;

    Utils.keys(props).forEach(prop => {
      if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(props[prop].kind)) {
        (this as any)[prop] = new Collection(this as AnyEntity);
      }
    });
  }

}
