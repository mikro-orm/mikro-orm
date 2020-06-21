import { ObjectId } from 'mongodb';
import { Book } from './Book';
import { Test } from './Test';
import { Collection } from '../TsMorphMetadataProvider.test';
export declare enum PublisherType {
    LOCAL = "local",
    GLOBAL = "global"
}
export declare class Publisher {
    _id: ObjectId;
    id: string;
    name: number;
    books: Collection<Book>;
    tests: Collection<Test>;
    type: PublisherType;
    constructor(name?: string, type?: PublisherType);
    beforeCreate(): void;
}
