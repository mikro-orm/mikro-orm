import {
  AfterCreate, AfterDelete, AfterUpdate, BeforeCreate, BeforeDelete, BeforeUpdate, Collection, Entity, OneToMany, Property, ManyToOne,
  QueryOrder, OnInit, ManyToMany, DateType, TimeType, Index, Unique, OneToOne, Cascade, LoadStrategy, EventArgs,
} from '@mikro-orm/core';

import { Book } from './Book';
import { BaseEntity } from './BaseEntity';
import { Address } from './Address';

@Entity()
@Index({ properties: ['name', 'age'] })
@Index({ name: 'custom_idx_name_13', properties: ['name'] })
@Unique({ properties: ['name', 'email'] })
export class Author extends BaseEntity {

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @Property({ length: 3, defaultRaw: 'current_timestamp(3)' })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date(), length: 3, defaultRaw: 'current_timestamp(3)' })
  updatedAt: Date = new Date();

  @Property()
  name: string;

  @Property({ unique: 'custom_email_unique_name' })
  @Index({ name: 'custom_email_index_name' })
  email: string;

  @Property({ nullable: true, default: null })
  age?: number;

  @Index()
  @Property({ default: 0 })
  termsAccepted: boolean = false;

  @Property({ nullable: true })
  optional?: boolean;

  @Property({ nullable: true })
  identities?: string[];

  @Property({ type: DateType, index: true, nullable: true })
  born?: Date;

  @Property({ type: TimeType, index: 'born_time_idx', nullable: true })
  bornTime?: string;

  @OneToMany({ entity: () => Book, mappedBy: 'author', orderBy: { title: QueryOrder.ASC } })
  books!: Collection<Book>;

  @OneToMany({ entity: () => Book, mappedBy: 'author', strategy: LoadStrategy.JOINED, orderBy: { title: QueryOrder.ASC } })
  books2!: Collection<Book>;

  @OneToOne({ entity: () => Address, mappedBy: address => address.author, cascade: [Cascade.ALL] })
  address?: Address;

  @ManyToMany({ entity: () => Author, pivotTable: 'author_to_friend' })
  friends = new Collection<Author>(this);

  @ManyToMany(() => Author)
  following = new Collection<Author>(this);

  @ManyToMany(() => Author, a => a.following)
  followers = new Collection<Author>(this);

  @ManyToOne({ nullable: true, onUpdateIntegrity: 'no action', onDelete: 'cascade' })
  favouriteBook?: Book;

  @ManyToOne({ nullable: true })
  favouriteAuthor?: Author;

  @Property({ persist: false })
  version!: number;

  @Property({ persist: false })
  versionAsString!: string;

  @Property({ persist: false })
  code!: string;

  @Property({ persist: false })
  booksTotal!: number;

  hookParams: any[] = [];

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
  }

  @OnInit()
  onInit() {
    this.code = `${this.email} - ${this.name}`;
    this.hookParams = [];
  }

  @BeforeCreate()
  beforeCreate(args: EventArgs<this>) {
    this.version = 1;
    this.hookParams.push(args);
  }

  @AfterCreate()
  afterCreate(args: EventArgs<this>) {
    this.versionAsString = 'v' + this.version;
    this.hookParams.push(args);
  }

  @BeforeUpdate()
  beforeUpdate(args: EventArgs<this>) {
    this.version += 1;
    this.hookParams.push(args);
  }

  @AfterUpdate()
  afterUpdate(args: EventArgs<this>) {
    this.versionAsString = 'v' + this.version;
    this.hookParams.push(args);
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
