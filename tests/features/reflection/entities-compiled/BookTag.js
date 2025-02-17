import { Collection, EntitySchema } from '@mikro-orm/core';
import { Book } from './Book.js';
export class BookTag {
    _id;
    id;
    name;
    books = new Collection(this);
    constructor(name) {
        this.name = name;
    }
}
export const BookTagSchema = new EntitySchema({
    class: BookTag,
    properties: {
        _id: { type: 'ObjectId', primary: true },
        id: { type: 'string', serializedPrimaryKey: true },
        name: { type: 'string' },
        books: { kind: 'm:n', entity: () => Book, mappedBy: 'tags' },
    },
});
