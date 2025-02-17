import { ObjectId } from 'bson';
import FooBar from './FooBar.js';
import { Book } from './Book.js';
export declare class FooBaz {
    _id: ObjectId;
    id: string;
    name: string;
    bar: FooBar;
    book: Book;
}
