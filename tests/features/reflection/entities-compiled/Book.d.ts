import { Publisher } from './Publisher';
import { Author } from './Author';
import { BookTag } from './BookTag';
import { Collection, Ref } from '../TsMorphMetadataProvider.test';
import { BaseEntity3 } from './BaseEntity3';
export declare class Book extends BaseEntity3 {
    title: string;
    author: Author;
    publisher: Ref<Publisher, '_id' | 'id'>;
    tags: Collection<BookTag>;
    metaObject?: object;
    metaArray?: any[];
    metaArrayOfStrings?: string[];
    constructor(title: string, author?: Author);
}
