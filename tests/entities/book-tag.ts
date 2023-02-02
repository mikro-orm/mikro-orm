import type { ObjectId } from 'bson';
import { Collection, EntitySchema } from '@mikro-orm/core';
import { Book } from './Book';

export class BookTag {

  _id!: ObjectId;
  id!: string;
  name: string;
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

export const schema = new EntitySchema({
  class: BookTag,
  properties: {
    _id: { type: 'ObjectId', primary: true },
    id: { type: 'string', serializedPrimaryKey: true },
    name: { type: 'string' },
    books: { kind: 'm:n', entity: () => Book, mappedBy: 'tags' },
  },
});
