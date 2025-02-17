import type { Collection, OptionalProps } from '@mikro-orm/core';
import { EntitySchema } from '@mikro-orm/core';
import type { IBaseEntity5 } from './BaseEntity5.js';
import type { IBook4 } from './Book4.js';
import type { ITest4 } from './Test4.js';
import { BaseEntity5 } from './BaseEntity5.js';

export interface IPublisher4 extends Omit<IBaseEntity5, typeof OptionalProps> {
  [OptionalProps]?: 'name' | 'type' | IBaseEntity5[typeof OptionalProps];
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
  extends: BaseEntity5,
  properties: {
    name: { type: 'string', default: 'asd' },
    type: { enum: true, items: () => PublisherType, default: PublisherType.LOCAL },
    enum3: { enum: true, items: [1, 2, 3], nullable: true },
    books: { kind: '1:m', entity: 'Book4', mappedBy: 'publisher' },
    tests: { kind: 'm:n', entity:  'Test4', fixedOrder: true },
  },
});
