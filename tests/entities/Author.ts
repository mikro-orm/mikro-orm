import { ObjectID } from 'mongodb';
import {
  AfterCreate, AfterDelete, AfterUpdate, BeforeCreate, BeforeDelete, BeforeUpdate,
  Collection, Entity, OneToMany, Property, ManyToOne, PrimaryKey, IEntity,
} from '../../lib';

import { Book } from './Book';
import { AuthorRepository } from '../repositories/AuthorRepository';

@Entity({ customRepository: () => AuthorRepository })
export class Author {

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

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

  @OneToMany({ entity: () => Book, fk: 'author', referenceColumnName: '_id' })
  books = new Collection<Book>(this);

  @ManyToOne()
  favouriteBook: Book;

  version: number;
  versionAsString: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
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

}

export interface Author extends IEntity { }
