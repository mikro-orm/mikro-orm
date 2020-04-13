import { EntitySchema, Collection, DateType, TimeType } from '@mikro-orm/core';
import { BaseEntity5 } from './BaseEntity5';
import { Book4 } from './Book4';

export interface Author4 extends BaseEntity5 {
  name: string;
  email: string;
  age?: number;
  termsAccepted?: boolean;
  identities?: string[];
  born?: Date;
  bornTime?: string;
  books: Collection<Book4>;
  favouriteBook?: Book4;
  version?: number;
}

export const schema = new EntitySchema<Author4, BaseEntity5>({
  name: 'Author4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string' },
    email: { type: 'string', unique: true },
    age: { type: 'number', nullable: true },
    termsAccepted: { type: 'boolean', default: 0, onCreate: () => false },
    identities: { type: 'string[]', nullable: true },
    born: { type: DateType, nullable: true, length: 3 },
    bornTime: { type: TimeType, nullable: true, length: 3 },
    books: { reference: '1:m', type: 'Book4', mappedBy: book => book.author },
    favouriteBook: { reference: 'm:1', type: 'Book4' },
    version: { type: 'number', persist: false },
  },
});
