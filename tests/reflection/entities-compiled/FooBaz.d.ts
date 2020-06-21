import { ObjectId } from 'mongodb';
import FooBar from './FooBar';
import { Book } from './Book';
export declare class FooBaz {
  _id: ObjectId;
  id: string;
  name: string;
  bar: FooBar;
  book: Book;
}
