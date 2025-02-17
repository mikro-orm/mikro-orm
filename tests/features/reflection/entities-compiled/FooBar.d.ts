import { ObjectId } from 'bson';
import type { FooBaz } from './FooBaz.js';
export default class FooBar {
    _id: ObjectId;
    id: string;
    name: string;
    baz: FooBaz | null;
    fooBar: FooBar;
}
