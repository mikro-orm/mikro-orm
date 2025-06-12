import {
  AfterCreate,
  AfterDelete,
  AfterUpdate,
  BeforeCreate,
  BeforeDelete,
  BeforeUpdate,
  Collection,
  Entity,
  OneToMany,
  Property,
  ManyToOne,
  QueryOrder,
  OnInit,
  ManyToMany,
  Index,
  Unique,
  OneToOne,
  Cascade,
  LoadStrategy,
  EventArgs,
  t,
  OnLoad,
  Opt,
  Hidden,
  Embeddable,
  Embedded,
  sql,
  OptionalProps,
} from '@mikro-orm/core';

import { Book2 } from './Book2.js';
import { BaseEntity2 } from './BaseEntity2.js';
import { Address2 } from './Address2.js';

@Embeddable()
export class Identity {

  @Property({ hidden: true })
  foo: string & Hidden;

  @Property({ hidden: true })
  bar: Hidden<number>;

  constructor(foo: string, bar: number) {
    this.foo = foo;
    this.bar = bar;
  }

  @Property({ persist: false })
  get fooBar() {
    return this.foo + ' ' + this.bar;
  }

}

@Entity()
@Index({ properties: ['name', 'age'] })
@Index({ name: 'custom_idx_name_123', properties: ['name'] })
@Unique({ properties: ['name', 'email'] })
export class Author2 extends BaseEntity2 {

  // just for testing the types, this is not needed
  [OptionalProps]?: 'id';

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @Property({ length: 3, default: sql.now(3) })
  createdAt: Opt<Date> = new Date();

  @Property({ onUpdate: () => new Date(), length: 3, default: sql.now(3) })
  updatedAt: Opt<Date> = new Date();

  @Property()
  name: string;

  @Property({ unique: 'custom_email_unique_name', groups: ['personal', 'admin'] })
  email: string;

  @Property({ nullable: true, default: null, groups: ['personal', 'admin'] })
  age?: number;

  @Index()
  @Property({ groups: ['admin'] })
  termsAccepted: Opt<boolean> = false;

  @Property({ nullable: true, groups: ['personal'] })
  optional?: boolean;

  @Property({ nullable: true, groups: ['admin'] })
  identities?: string[];

  @Property({ type: 'date', index: true, nullable: true, groups: ['personal', 'admin'] })
  born?: string;

  @Property({ type: t.time, index: 'born_time_idx', nullable: true, groups: ['personal', 'admin'] })
  bornTime?: string;

  @OneToMany({ entity: () => Book2, mappedBy: 'author', orderBy: { title: QueryOrder.ASC }, groups: ['personal'] })
  books = new Collection<Book2>(this);

  @OneToMany({ entity: () => Book2, mappedBy: 'author', strategy: LoadStrategy.JOINED, orderBy: { title: QueryOrder.ASC }, groups: ['personal'] })
  books2 = new Collection<Book2>(this);

  @OneToOne({ entity: () => Address2, mappedBy: address => address.author, cascade: [Cascade.ALL], groups: ['personal', 'admin'] })
  address?: Address2;

  @ManyToMany({ entity: () => Author2, pivotTable: 'author_to_friend', groups: ['personal'] })
  friends = new Collection<Author2>(this);

  @ManyToMany(() => Author2, undefined, { groups: ['personal'] })
  following = new Collection<Author2>(this);

  @ManyToMany(() => Author2, a => a.following, { groups: ['personal'] })
  followers = new Collection<Author2>(this);

  @ManyToOne({ nullable: true, updateRule: 'no action', deleteRule: 'cascade', groups: ['personal'] })
  favouriteBook?: Book2;

  @ManyToOne(() => Author2, { nullable: true, groups: ['personal'] })
  favouriteAuthor?: Author2 | null;

  @Embedded(() => Identity, { nullable: true, object: true, groups: ['personal', 'admin'] })
  identity?: Identity;

  @Property({ persist: false })
  version!: number & Opt;

  @Property({ persist: false })
  versionAsString!: string & Opt;

  @Property({ persist: false, groups: ['admin'] })
  code!: string & Opt;

  @Property({ persist: false })
  booksTotal!: number & Opt;

  hookParams: any[] & Opt = [];
  onLoadCalled?: number;

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

  @OnLoad()
  onLoad() {
    this.onLoadCalled = this.onLoadCalled ? this.onLoadCalled + 1 : 1;
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

  @Property({ name: 'code', groups: ['admin'] })
  getCode(): string & Opt {
    return `${this.email} - ${this.name}`;
  }

  @Property({ persist: false, groups: ['admin'] })
  get code2(): string & Opt {
    return `${this.email} - ${this.name}`;
  }

}
