import type { Collection } from '@mikro-orm/core';
import { EntitySchema, Enum } from '@mikro-orm/core';
import type { IBaseEntity5 } from './BaseEntity5';
import type { IBook4 } from './Book4';
import type { ITest4 } from './Test4';

export interface IPublisher4 extends IBaseEntity5 {
  name: string;
  type: PublisherType;
  books: Collection<IBook4>;
  tests: Collection<ITest4>;
  enum3?: number;
}

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}

export const Publisher4 = new EntitySchema<IPublisher4, IBaseEntity5>({
  name: 'Publisher4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string', default: 'asd' },
    type: { enum: true, items: () => PublisherType, default: PublisherType.LOCAL },
    enum3: { enum: true, items: [1, 2, 3], nullable: true },
    books: { reference: '1:m', entity: 'Book4', mappedBy: 'publisher' },
    tests: { reference: 'm:n', entity:  'Test4', fixedOrder: true },
  },
});
