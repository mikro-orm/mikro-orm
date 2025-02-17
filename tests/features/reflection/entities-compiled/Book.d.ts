import { Collection, Ref } from '@mikro-orm/core';
import type { Publisher } from './Publisher.js';
import { Author } from './Author.js';
import type { BookTag } from './BookTag.js';
import { BaseEntity3 } from './BaseEntity3.js';
export declare class Book extends BaseEntity3 {
    title: string;
    author: Author;
    publisher: Ref<Publisher>;
    tags: Collection<BookTag, object>;
    metaObject?: object;
    metaArray?: any[];
    metaArrayOfStrings?: string[];
    constructor(title: string, author?: Author);
}
