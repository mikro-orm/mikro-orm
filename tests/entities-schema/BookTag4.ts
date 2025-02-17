import type { Collection, OptionalProps } from '@mikro-orm/core';
import { EntitySchema } from '@mikro-orm/core';
import type { IBaseEntity5 } from './BaseEntity5.js';
import type { IBook4 } from './Book4.js';
import { BaseEntity5 } from './BaseEntity5.js';

export interface IBookTag4 extends Omit<IBaseEntity5, typeof OptionalProps> {
  [OptionalProps]?: 'version' | IBaseEntity5[typeof OptionalProps];
  name: string;
  books: Collection<IBook4>;
  version: Date;
}

export const BookTag4 = new EntitySchema<IBookTag4, IBaseEntity5>({
  name: 'BookTag4',
  extends: BaseEntity5,
  properties: {
    name: { type: 'string' },
    books: { kind: 'm:n', entity: 'Book4', mappedBy: 'tags' },
    version: { type: 'Date', version: true },
  },
});
