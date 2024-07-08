import { Book } from './Book';
import { BaseEntity } from './BaseEntity';
import { Collection } from '../TsMorphMetadataProvider.test';
export declare class Author extends BaseEntity {
    name: string;
    email: string;
    age: number | null;
    termsAccepted: boolean;
    optional?: boolean;
    identities?: string[];
    born?: string;
    books: Collection<Book>;
    friends: Collection<Author>;
    favouriteBook: Book;
    favouriteAuthor: Author;
    version: number;
    versionAsString: string;
    constructor(name: string, email: string);
}
