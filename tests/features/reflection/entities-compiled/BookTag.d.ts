import { ObjectId } from 'mongodb';
import { Collection, EntitySchema } from '@mikro-orm/core';
import { Book } from './Book';
export declare class BookTag {
    _id: ObjectId;
    id: string;
    name: string;
    books: Collection<Book, import("@mikro-orm/core").AnyEntity<any>>;
    constructor(name: string);
}
export declare const BookTagSchema: EntitySchema<BookTag, undefined>;
