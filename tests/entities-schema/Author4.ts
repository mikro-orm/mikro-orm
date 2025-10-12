import { HiddenProps, defineEntity, EventArgs, InferEntity, p } from '@mikro-orm/core';
import { Book4 } from './Book4';
import { BaseProperties } from './BaseEntity5';

export class Identity {

  [HiddenProps]?: 'foo' | 'bar';

  constructor(public foo: string, public bar: number) {}

  get fooBar() {
    return this.foo + ' ' + this.bar;
  }

}

export const IdentitySchema = defineEntity({
  class: Identity,
  embeddable: true,
  properties: {
    foo: p.string().hidden(),
    bar: p.integer().hidden(),
    fooBar: p.string().getter().persist(false),
  },
});

export const Author4 = defineEntity({
  name: 'Author4',
  properties: {
    ...BaseProperties,
    name: p.string(),
    email: p.string().unique(),
    age: p.smallint().nullable(),
    termsAccepted: p.boolean().default(0).onCreate(() => false),
    identities: p.array().nullable(),
    born: p.date().nullable(),
    bornTime: p.time(3).nullable(),
    books: () => p.oneToMany(Book4).mappedBy(book => book.author),
    favouriteBook: () => p.manyToOne(Book4).nullable(),
    version: p.integer().persist(false),
    identity: p.embedded(IdentitySchema).object().nullable(),
  },
  hooks: {
    onLoad: [randomHook],
  },
});

function randomHook(args: EventArgs<any>) {
  const args1 = args as EventArgs<IAuthor4>;
  // ...
}

export interface IAuthor4 extends InferEntity<typeof Author4> {}
