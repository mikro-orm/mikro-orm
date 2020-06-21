import { ObjectId } from 'mongodb';
import { Collection, EntitySchema } from '@mikro-orm/core';
import { Book } from './Book';
export declare class BookTag {
    _id: ObjectId;
    id: string;
    name: string;
    books: Collection<Book, import("../../../packages/core/src").AnyEntity<any, string | number | symbol>>;
    constructor(name: string);
}
export declare const BookTagSchema: EntitySchema<BookTag, undefined>;
