import { Collection, EntitySchema, Reference } from '@mikro-orm/core';
import { IBaseEntity5 } from './BaseEntity5';
import { IAuthor4 } from './Author4';
import { IPublisher4 } from './Publisher4';
import { IBookTag4 } from './BookTag4';

export interface IBook4 extends IBaseEntity5 {
  title: string;
  author: IAuthor4;
  publisher?: Reference<IPublisher4>;
  tags: Collection<IBookTag4>;
  tagsUnordered: Collection<IBookTag4>;
}

export const Book4 = new EntitySchema<IBook4, IBaseEntity5>({
  name: 'Book4',
  extends: 'BaseEntity5',
  properties: {
    title: { type: 'string' },
    author: { reference: 'm:1', entity: 'Author4', inversedBy: 'books' },
    publisher: { reference: 'm:1', entity: 'Publisher4', inversedBy: 'books', wrappedReference: true, nullable: true },
    tags: { reference: 'm:n', entity: 'BookTag4', inversedBy: 'books', pivotTable: 'tags_ordered', fixedOrder: true },
    tagsUnordered: { reference: 'm:n', entity: 'BookTag4', inversedBy: 'books', pivotTable: 'tags_unordered' },
  },
});
