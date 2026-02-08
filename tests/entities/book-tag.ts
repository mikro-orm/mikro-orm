import { ObjectId } from 'bson';
import { Collection, defineEntity, p } from '@mikro-orm/core';
import { Book } from './Book.js';

export class BookTag {
  _id!: ObjectId;
  id!: string;
  name: string;
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }
}

export const schema = defineEntity({
  class: BookTag,
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    name: p.string(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});
