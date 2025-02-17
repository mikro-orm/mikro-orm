import { Collection, EventArgs, Opt } from '@mikro-orm/core';
import { EntitySchema, DateType, TimeType, BooleanType, t, ReferenceKind, HiddenProps } from '@mikro-orm/core';
import type { IBook4 } from './Book4.js';
import { BaseEntity4 } from './BaseEntity4.js';

function randomHook(args: EventArgs<Author4>) {
  // ...
}

export class Author4 extends BaseEntity4 {

  name!: string;
  email!: string;
  age?: number;
  termsAccepted?: boolean;
  identities?: string[];
  born?: string;
  bornTime?: string;
  books = new Collection<IBook4>(this);
  favouriteBook?: IBook4;
  version!: number & Opt;
  versionAsString?: string;
  identity?: Identity;

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  async beforeCreate(args: EventArgs<this>) {
    this.version = 1;
    await args.em.findOne('Book4', { title: { $ne: null } }); // test this won't cause failures (GH #1503)
  }

  async afterCreate(args: EventArgs<this>) {
    this.versionAsString = 'v' + this.version;
    await args.em.findOne('Book4', { title: { $nin: [''] } }); // test this won't cause failures (GH #1503)
  }

  beforeUpdate() {
    this.version += 1;
  }

  afterUpdate() {
    this.versionAsString = 'v' + this.version;
  }

  beforeDelete() {
    Author4.beforeDestroyCalled += 1;
  }

  afterDelete() {
    Author4.afterDestroyCalled += 1;
  }

}

async function beforeUpdate(this: Author4, args: EventArgs<Author4>) {
  this.version += 1;
  await args.em.findOne('Book4', { title: { $ne: null } }); // test this won't cause failures (GH #1503)
}

async function afterUpdate(this: Author4, args: EventArgs<Author4>) {
  this.versionAsString = 'v' + this.version;
  await args.em.findOne('Book4', { title: { $nin: [''] } }); // test this won't cause failures (GH #1503)
}

function beforeDelete() {
  Author4.beforeDestroyCalled += 1;
}

function afterDelete() {
  Author4.afterDestroyCalled += 1;
}

export class Identity {

  [HiddenProps]?: 'foo' | 'bar';

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

export const schema = new EntitySchema<Author4, BaseEntity4>({
  class: Author4,
  extends: BaseEntity4.name,
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
    versionAsString: { type: 'string', persist: false },
    identity: { type: 'Identity', kind: ReferenceKind.EMBEDDED, nullable: true, object: true },
  },
  hooks: {
    onLoad: [randomHook],
    beforeCreate: ['beforeCreate'],
    afterCreate: ['afterCreate'],
    beforeUpdate: ['beforeUpdate', beforeUpdate],
    afterUpdate: ['afterUpdate', afterUpdate],
    beforeDelete: ['beforeDelete', beforeDelete],
    afterDelete: ['afterDelete', afterDelete],
  },
});
