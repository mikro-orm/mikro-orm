import { Collection, EntitySchema } from '@mikro-orm/core';
import { BaseEntity5 } from './BaseEntity5';
import { Author4 } from './Author4';
import { Publisher4 } from './Publisher4';
import { BookTag4 } from './BookTag4';

export interface Book4 extends BaseEntity5 {
  title: string;
  author: Author4;
  publisher: Publisher4;
  tags: Collection<BookTag4>;
  tagsUnordered: Collection<BookTag4>;
}

export const schema = new EntitySchema<Book4, BaseEntity5>({
  name: 'Book4',
  extends: 'BaseEntity5',
  properties: {
    title: { type: 'string' },
    author: { reference: 'm:1', entity: 'Author4', inversedBy: 'books' },
    publisher: { reference: 'm:1', entity: 'Publisher4', inversedBy: 'books' },
    tags: { reference: 'm:n', entity: 'BookTag4', inversedBy: 'books', pivotTable: 'tags_ordered', fixedOrder: true },
    tagsUnordered: { reference: 'm:n', entity: 'BookTag4', inversedBy: 'books', pivotTable: 'tags_unordered' },
  },
});
