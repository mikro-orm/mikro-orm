import {
  AfterCreate, AfterDelete, AfterUpdate, BeforeCreate, BeforeDelete, BeforeUpdate,
  BaseEntity, Collection, Entity, OneToMany, Property, ManyToOne,
} from '../../lib';

import { Book } from './Book';
import { AuthorRepository } from '../repositories/AuthorRepository';

@Entity({ customRepository: AuthorRepository })
export class Author extends BaseEntity {

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  born: Date;

  @OneToMany({ entity: () => Book.name, fk: 'author' })
  books: Collection<Book>;

  @ManyToOne({ entity: () => Book.name })
  favouriteBook: Book;

  version: number;
  versionAsString: string;

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
  }

  @BeforeCreate()
  beforeCreate() {
    this.version = 1;
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
