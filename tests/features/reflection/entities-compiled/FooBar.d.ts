import { ObjectId } from 'bson';
import { FooBaz } from './FooBaz';
export default class FooBar {
    _id: ObjectId;
    id: string;
    name: string;
    baz: FooBaz | null;
    fooBar: FooBar;
}
