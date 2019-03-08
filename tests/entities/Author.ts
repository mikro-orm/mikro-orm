import {
  AfterCreate, AfterDelete, AfterUpdate, BeforeCreate, BeforeDelete, BeforeUpdate,
  Cascade, Collection, Entity, OneToMany, Property, ManyToOne, EntityAssigner,
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

  @ManyToOne()
  favouriteBook: Book;

  version: number;
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

  toJSON(): { [p: string]: any } {
    const o = this.toObject();
    o.fooBar = 123;

    return o;
  }

}
