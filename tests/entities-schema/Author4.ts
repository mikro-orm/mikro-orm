import type { Collection, EventArgs } from '@mikro-orm/core';
import { EntitySchema, DateType, TimeType, BooleanType, t, ReferenceKind, wrap } from '@mikro-orm/core';
import type { IBaseEntity5 } from './BaseEntity5';
import type { IBook4 } from './Book4';

export interface IAuthor4 extends IBaseEntity5 {
  name: string;
  email: string;
  age?: number;
  termsAccepted?: boolean;
  identities?: string[];
  born?: Date;
  bornTime?: string;
  books: Collection<IBook4>;
  favouriteBook?: IBook4;
  version?: number;
  identity?: Identity;
}

function randomHook(args: EventArgs<IAuthor4>) {
  // ...
}

export class Identity {

  constructor(public foo: string, public bar: number) {}

  get fooBar() {
    return this.foo + ' ' + this.bar;
  }

}

export const IdentitySchema = new EntitySchema({
  class: Identity,
  embeddable: true,
  properties: {
    foo: { type: 'string', hidden: true },
    bar: { type: 'number', hidden: true },
    fooBar: { type: 'string', getter: true, persist: false },
  },
});

export const Author4 = new EntitySchema<IAuthor4, IBaseEntity5>({
  name: 'Author4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string' },
    email: { type: 'string', unique: true },
    age: { type: t.smallint, nullable: true },
    termsAccepted: { type: BooleanType, default: 0, onCreate: () => false },
    identities: { type: 'string[]', nullable: true },
    born: { type: DateType, nullable: true, length: 3 },
    bornTime: { type: TimeType, nullable: true, length: 3 },
    books: { kind: '1:m', type: 'Book4', mappedBy: book => book.author },
    favouriteBook: { kind: 'm:1', type: 'Book4', nullable: true },
    version: { type: 'number', persist: false },
    identity: { type: 'Identity', kind: ReferenceKind.EMBEDDED, nullable: true, object: true },
  },
  hooks: {
    onLoad: [randomHook],
  },
});
