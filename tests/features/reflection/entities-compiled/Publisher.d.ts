import { ObjectId } from 'bson';
import { Collection } from '@mikro-orm/core';
import type { Book } from './Book.js';
import type { Test } from './Test.js';
import { PublisherType } from './PublisherType.js';
export declare enum PublisherType2 {
    LOCAL2 = "local2",
    GLOBAL2 = "global2"
}
export declare class Publisher {
    _id: ObjectId;
    id: string;
    name: number;
    books: Collection<Book, object>;
    tests: Collection<Test, object>;
    type: PublisherType;
    types: PublisherType2[];
    types2: PublisherType2[];
    constructor(name?: string, type?: PublisherType);
    beforeCreate(): void;
}
