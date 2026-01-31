import { HiddenProps, defineEntity, p, EventArgs, Collection, Opt } from '@mikro-orm/core';
import { Book4, IBook4 } from './Book4.js';
import { BaseProperties } from './BaseEntity5.js';
import { BaseEntity4 } from './BaseEntity4.js';

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

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
  }

  async beforeCreate(args: EventArgs<this>) {
    this.version = 1;
    await args.em.findOne(Book4, { title: { $ne: null } }); // test this won't cause failures (GH #1503)
  }

  async afterCreate(args: EventArgs<this>) {
    this.versionAsString = 'v' + this.version;
    await args.em.findOne(Book4, { title: { $nin: [''] } }); // test this won't cause failures (GH #1503)
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
  await args.em.findOne(Book4, { title: { $ne: null } }); // test this won't cause failures (GH #1503)
}

async function afterUpdate(this: Author4, args: EventArgs<Author4>) {
  this.versionAsString = 'v' + this.version;
  await args.em.findOne(Book4, { title: { $nin: [''] } }); // test this won't cause failures (GH #1503)
}

function beforeDelete() {
  Author4.beforeDestroyCalled += 1;
}

function afterDelete() {
  Author4.afterDestroyCalled += 1;
}

function randomHook(args: EventArgs<Author4>) {
  //
}

export const Author4Schema = defineEntity({
  class: Author4,
  extends: BaseEntity4,
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
    versionAsString: p.string().persist(false),
    identity: p.embedded(IdentitySchema).object().nullable(),
  },
  hooks: {
    onLoad: [
      randomHook,
      ({ entity: author }) => {
        const age = author.age;
        const email = author.email;
      },
    ],
    beforeCreate: ['beforeCreate'],
    afterCreate: ['afterCreate'],
    beforeUpdate: ['beforeUpdate', beforeUpdate],
    afterUpdate: ['afterUpdate', afterUpdate],
    beforeDelete: ['beforeDelete', beforeDelete],
    afterDelete: ['afterDelete', afterDelete],
  },
});

Author4Schema.addHook('onLoad', args => {
  const identity = args.entity.identity;
});
