import { Collection } from '@mikro-orm/core';
import { Book } from './Book.js';
import { BaseEntity } from './BaseEntity.js';
export declare class Author extends BaseEntity {
    name: string;
    email: string;
    age: number | null;
    termsAccepted: boolean;
    optional?: boolean;
    identities?: string[];
    born?: string;
    books: Collection<Book, object>;
    friends: Collection<Author, object>;
    favouriteBook: Book;
    favouriteAuthor: Author;
    version: number;
    versionAsString: string;
    constructor(name: string, email: string);
    getCode(): string;
}
