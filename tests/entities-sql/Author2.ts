import {
  AfterCreate, AfterDelete, AfterUpdate, BeforeCreate, BeforeDelete, BeforeUpdate,
  Collection, Entity, OneToMany, Property, ManyToOne, QueryOrder,
} from '../../lib';

import { Book2 } from './Book2';
import { BaseEntity2 } from './BaseEntity2';

@Entity()
export class Author2 extends BaseEntity2 {

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @Property({ length: 3, default: 'CURRENT_TIMESTAMP(3)' })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), length: 3, default: 'CURRENT_TIMESTAMP(3)' })
  updatedAt = new Date();

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @Property({ nullable: true })
  age: number;

  @Property({ default: 0 })
  termsAccepted = false;

  @Property({ nullable: true })
  identities: string[];

  @Property({ nullable: true })
  born: Date;

  @OneToMany({ entity: () => Book2, fk: 'author', orderBy: { createdAt: QueryOrder.ASC } })
  books: Collection<Book2>;

  @ManyToOne()
  favouriteBook: Book2;

  @ManyToOne()
  favouriteAuthor: Author2;

  @Property({ persist: false })
  version: number;

  @Property({ persist: false })
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
    Author2.beforeDestroyCalled += 1;
  }

  @AfterDelete()
  afterDelete() {
    Author2.afterDestroyCalled += 1;
  }

}
