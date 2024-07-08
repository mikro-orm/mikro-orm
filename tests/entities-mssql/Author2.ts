import {
  AfterCreate, AfterDelete, AfterUpdate, BeforeCreate, BeforeDelete, BeforeUpdate, Collection, Entity, OneToMany, Property, ManyToOne,
  QueryOrder, OnInit, ManyToMany, DateType, TimeType, Index, Unique, OneToOne, Cascade, LoadStrategy, EventArgs, OptionalProps,
} from '@mikro-orm/core';

import { Book2 } from './Book2';
import { BaseEntity2 } from './BaseEntity2';
import { Address2 } from './Address2';

@Entity()
@Index({ properties: ['name', 'age'] })
@Index({ name: 'custom_idx_name_123', properties: ['name'] })
@Unique({ properties: ['name', 'email'] })
export class Author2 extends BaseEntity2 {

  [OptionalProps]?: 'createdAt' | 'updatedAt' | 'termsAccepted' | 'version' | 'versionAsString' | 'code' | 'booksTotal' | 'hookParams' | 'hookTest';

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @Property({ length: 3, defaultRaw: 'current_timestamp' })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date(), length: 3, defaultRaw: 'current_timestamp' })
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
  born?: string;

  @Property({ type: TimeType, index: 'born_time_idx', nullable: true })
  bornTime?: string;

  @OneToMany({ entity: () => Book2, mappedBy: 'author', orderBy: { title: QueryOrder.ASC } })
  books = new Collection<Book2>(this);

  @OneToMany({ entity: () => Book2, mappedBy: 'author', strategy: LoadStrategy.JOINED, orderBy: { title: QueryOrder.ASC } })
  books2 = new Collection<Book2>(this);

  @OneToOne({ entity: () => Address2, mappedBy: address => address.author, cascade: [Cascade.ALL], lazy: true })
  address?: Address2;

  @ManyToMany({ entity: () => Author2, pivotTable: 'author_to_friend' })
  friends: Collection<Author2> = new Collection<Author2>(this);

  @ManyToMany(() => Author2)
  following: Collection<Author2> = new Collection<Author2>(this);

  @ManyToMany(() => Author2, a => a.following)
  followers: Collection<Author2> = new Collection<Author2>(this);

  @ManyToOne({ nullable: true, updateRule: 'no action', deleteRule: 'cascade' })
  favouriteBook?: Book2;

  @ManyToOne({ nullable: true })
  favouriteAuthor?: Author2;

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
    Author2.beforeDestroyCalled += 1;
  }

  @AfterDelete()
  afterDelete() {
    Author2.afterDestroyCalled += 1;
  }

}
