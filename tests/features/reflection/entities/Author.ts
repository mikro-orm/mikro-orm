import { DateType, Cascade, Entity, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { Book } from './Book.js';
import { BaseEntity } from './BaseEntity.js';
import { Collection } from '../TsMorphMetadataProvider.test.js';

@Entity()
export class Author extends BaseEntity {

  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  age: number | null = null;

  @Property()
  termsAccepted = false;

  @Property()
  optional?: boolean;

  @Property({ fieldName: 'identitiesArray' })
  identities?: string[];

  @Property({ type: new DateType() })
  born?: string;

  @OneToMany('Book', 'author', { referenceColumnName: '_id', cascade: [Cascade.PERSIST], orphanRemoval: true })
  books = new Collection<Book>(this);

  @ManyToMany()
  friends = new Collection<Author>(this);

  @ManyToOne()
  favouriteBook!: Book;

  @ManyToOne()
  favouriteAuthor!: Author;

  @Property({ persist: false })
  version!: number;

  @Property({ persist: false })
  versionAsString!: string;

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
    this.foo = 'bar';
  }

  @Property({ name: 'code' })
  getCode() {
    return `${this.email} - ${this.name}`;
  }

}
