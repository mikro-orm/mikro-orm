import { BaseEntity5 } from './BaseEntity5';
import { Collection } from '../../lib/entity';
import { Book4 } from './Book4';
import { EntitySchema } from '../../lib/schema';

export interface BookTag4 extends BaseEntity5 {
  name: string;
  books: Collection<Book4>;
  version: Date;
}

export const schema = new EntitySchema<BookTag4, BaseEntity5>({
  name: 'BookTag4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string' },
    books: { reference: 'm:n', entity: 'Book4', mappedBy: 'tags' },
    version: { type: 'Date', version: true },
  },
});
