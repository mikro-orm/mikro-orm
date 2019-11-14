import {
  AfterCreate, AfterDelete, AfterUpdate, BeforeCreate, BeforeDelete, BeforeUpdate,
  Collection, Entity, OneToMany, Property, ManyToOne, QueryOrder, OnInit, ManyToMany,
} from '../../lib';

import { Book2 } from './Book2';
import { BaseEntity2 } from './BaseEntity2';

@Entity()
export class Author2 extends BaseEntity2 {

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @Property({ length: 3, default: 'current_timestamp(3)' })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), length: 3, default: 'current_timestamp(3)' })
  updatedAt = new Date();

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @Property()
  age?: number;

  @Property({ default: 0 })
  termsAccepted = false;

  @Property()
  identities?: string[];

  @Property({ length: 0 })
  born?: Date;

  @OneToMany({ mappedBy: 'author', orderBy: { title: QueryOrder.ASC } })
  books!: Collection<Book2>;

  @ManyToMany({ entity: () => Author2, pivotTable: 'author_to_friend' })
  friends = new Collection<Author2>(this);

  @ManyToMany(() => Author2)
  following = new Collection<Author2>(this);

  @ManyToMany(() => Author2, a => a.following)
  followers = new Collection<Author2>(this);

  @ManyToOne()
  favouriteBook?: Book2;

  @ManyToOne()
  favouriteAuthor?: Author2;

  @Property({ persist: false })
  version!: number;

  @Property({ persist: false })
  versionAsString!: string;

  @Property({ persist: false })
  code!: string;

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
  }

  @OnInit()
  onInit() {
    this.code = `${this.email} - ${this.name}`;
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
    Author2.beforeDestroyCalled += 1;
  }

  @AfterDelete()
  afterDelete() {
    Author2.afterDestroyCalled += 1;
  }

}
