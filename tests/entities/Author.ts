import type { EntityDTO, Dictionary } from '@mikro-orm/core';
import {
  AfterCreate, AfterDelete, AfterUpdate, BeforeCreate, BeforeDelete, BeforeUpdate, DateType, Collection, Filter,
  Cascade, Entity, ManyToMany, ManyToOne, OneToMany, Property, Index, Unique, EntityAssigner, EntityRepositoryType,
} from '@mikro-orm/core';

import { Book } from './Book';
import { AuthorRepository } from '../repositories/AuthorRepository';
import { BaseEntity } from './BaseEntity';

@Entity({ customRepository: () => AuthorRepository })
@Index({ name: 'custom_idx_1', properties: ['name', 'email'] })
@Filter({
  name: 'withoutParams1',
  cond(_, type) {
    expect(['read', 'update', 'delete'].includes(type)).toBe(true);
    return {};
  },
  args: false,
  default: true,
})
export class Author extends BaseEntity<Author> {

  [EntityRepositoryType]: AuthorRepository;

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @Property()
  name: string;

  @Unique()
  @Property()
  email: string;

  @Property({ nullable: true })
  @Unique({ name: 'age_uniq', options: { partialFilterExpression: { age: { $exists: true } } } })
  age?: number;

  @Property()
  termsAccepted: boolean = false;

  @Property({ nullable: true })
  optional?: boolean;

  @Property({ nullable: true, name: 'identitiesArray' })
  identities?: string[];

  @Property({ nullable: true, type: DateType })
  @Index()
  born?: Date;

  @OneToMany(() => Book, book => book.author, { referenceColumnName: '_id', cascade: [Cascade.PERSIST], orphanRemoval: true })
  books = new Collection<Book>(this);

  @ManyToMany(() => Author)
  friends = new Collection<Author>(this);

  @ManyToOne(() => Book)
  favouriteBook!: Book;

  @ManyToOne(() => Author)
  favouriteAuthor!: Author;

  @Property({ persist: false })
  version!: number;

  @Property({ persist: false })
  versionAsString!: string;

  @Property()
  tenant?: number;

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

  @Property({ persist: false })
  get code2() {
    return `${this.email} - ${this.name}`;
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

  assign(data: any): Author {
    return EntityAssigner.assign<Author>(this, data);
  }

  toJSON(strict = true, strip = ['id', 'email'], ...args: any[]): EntityDTO<Author> {
    const o = this.toObject(...args);
    (o as Dictionary).fooBar = 123;

    if (strict) {
      strip.forEach(k => delete o[k]);
    }

    return o;
  }

}
