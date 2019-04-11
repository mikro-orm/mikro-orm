import {
  AfterCreate, AfterDelete, AfterUpdate, BeforeCreate, BeforeDelete, BeforeUpdate,
  Cascade, Collection, Entity, EntityAssigner, ManyToMany, ManyToOne, OneToMany, Property,
} from '../../lib';

import { Book } from './Book';
import { AuthorRepository } from '../repositories/AuthorRepository';
import { BaseEntity } from './BaseEntity';

@Entity({ customRepository: () => AuthorRepository })
export class Author extends BaseEntity {

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  age: number;

  @Property()
  termsAccepted = false;

  @Property({ fieldName: 'identitiesArray' })
  identities: string[];

  @Property()
  born: Date;

  @OneToMany({ entity: () => Book, fk: 'author', referenceColumnName: '_id', cascade: [Cascade.PERSIST, Cascade.REMOVE] })
  books = new Collection<Book>(this);

  @ManyToMany({ entity: () => Author, owner: true })
  friends: Collection<Author> = new Collection<Author>(this);

  @ManyToOne()
  favouriteBook: Book;

  @ManyToOne()
  favouriteAuthor: Author;

  @Property({ persist: false })
  version: number;

  @Property({ persist: false })
  versionAsString: string;

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
    this.foo = 'bar';
  }

  @BeforeCreate()
  beforeCreate() {
    this.version = 1;
  }

  @BeforeCreate()
  beforeCreate2() {
    // do sth else
  }

  @AfterCreate()
  afterCreate() {
    this.versionAsString = 'v' + this.version;
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.version += 1;
  }

  @AfterUpdate()
  afterUpdate() {
    this.versionAsString = 'v' + this.version;
  }

  @BeforeDelete()
  beforeDelete() {
    Author.beforeDestroyCalled += 1;
  }

  @AfterDelete()
  afterDelete() {
    Author.afterDestroyCalled += 1;
  }

  assign(data: any): void {
    EntityAssigner.assign(this, data);
  }

  toJSON(strict = true, strip = ['id', 'email'], ...args: any[]): { [p: string]: any } {
    const o = this.toObject(...args);
    o.fooBar = 123;

    if (strict) {
      strip.forEach(k => delete o[k]);
    }

    return o;
  }

}
