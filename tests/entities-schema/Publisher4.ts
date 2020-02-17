import { BaseEntity5 } from './BaseEntity5';
import { Collection } from '../../lib/entity';
import { Book4 } from './Book4';
import { EntitySchema } from '../../lib/schema';
import { Test4 } from './Test4';

export interface Publisher4 extends BaseEntity5 {
  name: string;
  type: PublisherType;
  books: Collection<Book4>;
  tests: Collection<Test4>;
}

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}

export const schema = new EntitySchema<Publisher4, BaseEntity5>({
  name: 'Publisher4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string', default: 'asd' },
    type: { enum: true, items: () => PublisherType, default: PublisherType.LOCAL },
    books: { reference: '1:m', entity: 'Book4', mappedBy: 'publisher' },
    tests: { reference: 'm:n', entity:  'Test4', fixedOrder: true },
  },
});
