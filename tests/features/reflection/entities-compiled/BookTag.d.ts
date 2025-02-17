import type { ObjectId } from 'bson';
import { Collection, EntitySchema } from '@mikro-orm/core';
import { Book } from './Book.js';
export declare class BookTag {
    _id: ObjectId;
    id: string;
    name: string;
    books: Collection<Book, object>;
    constructor(name: string);
}
export declare const BookTagSchema: EntitySchema<BookTag, never>;
