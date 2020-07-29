import { Collection, EntitySchema } from '@mikro-orm/core';
import { IBaseEntity5 } from './BaseEntity5';
import { IBook4 } from './Book4';
import { ITest4 } from './Test4';

export interface IPublisher4 extends IBaseEntity5 {
  name: string;
  type: PublisherType;
  books: Collection<IBook4>;
  tests: Collection<ITest4>;
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
    books: { reference: '1:m', entity: 'Book4', mappedBy: 'publisher' },
    tests: { reference: 'm:n', entity:  'Test4', fixedOrder: true },
  },
});
