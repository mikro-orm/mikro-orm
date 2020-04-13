import { DateType, Cascade, Entity, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { Book } from './Book';
import { BaseEntity } from './BaseEntity';
import { Collection } from '../TsMorphMetadataProvider.test';

@Entity()
export class Author extends BaseEntity {

  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  age?: number;

  @Property()
  termsAccepted = false;

  @Property()
  optional?: boolean;

  @Property({ fieldName: 'identitiesArray' })
  identities?: string[];

  @Property({ type: DateType })
  born?: Date;

  @OneToMany(() => 'Book', 'author', { referenceColumnName: '_id', cascade: [Cascade.PERSIST], orphanRemoval: true })
  books = new Collection<Book>(this);

  @ManyToMany(() => Author)
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

}
