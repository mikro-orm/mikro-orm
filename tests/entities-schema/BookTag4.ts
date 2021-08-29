import type { Collection } from '@mikro-orm/core';
import { EntitySchema } from '@mikro-orm/core';
import type { IBaseEntity5 } from './BaseEntity5';
import type { IBook4 } from './Book4';

export interface IBookTag4 extends IBaseEntity5 {
  name: string;
  books: Collection<IBook4>;
  version: Date;
}

export const BookTag4 = new EntitySchema<IBookTag4, IBaseEntity5>({
  name: 'BookTag4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string' },
    books: { reference: 'm:n', entity: 'Book4', mappedBy: 'tags' },
    version: { type: 'Date', version: true },
  },
});
