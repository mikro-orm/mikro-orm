import type { Collection, Reference } from '@mikro-orm/core';
import { EntitySchema, t } from '@mikro-orm/core';
import type { IBaseEntity5 } from './BaseEntity5';
import type { IAuthor4 } from './Author4';
import type { IPublisher4 } from './Publisher4';
import type { IBookTag4 } from './BookTag4';

export interface Book4Meta {
  category: string;
  items: number;
  valid?: boolean;
  nested?: { foo: string; bar?: number; deep?: { baz: number; qux: boolean } };
}

export interface IBook4 extends IBaseEntity5 {
  title: string;
  price?: number;
  author?: IAuthor4;
  publisher?: Reference<IPublisher4>;
  tags: Collection<IBookTag4>;
  tagsUnordered: Collection<IBookTag4>;
  meta: Book4Meta;
}

export const Book4 = new EntitySchema<IBook4, IBaseEntity5>({
  name: 'Book4',
  extends: 'BaseEntity5',
  properties: {
    title: { type: t.string },
    price: { type: t.float, nullable: true },
    author: { reference: 'm:1', entity: 'Author4', inversedBy: 'books', nullable: true },
    publisher: { reference: 'm:1', entity: 'Publisher4', inversedBy: 'books', wrappedReference: true, nullable: true },
    tags: { reference: 'm:n', entity: 'BookTag4', inversedBy: 'books', pivotTable: 'tags_ordered', fixedOrder: true },
    tagsUnordered: { reference: 'm:n', entity: 'BookTag4', inversedBy: 'books', pivotTable: 'tags_unordered' },
    meta: { type: 'json', nullable: true },
  },
});
