import { ObjectId } from 'bson';
import {
  Collection,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryKey,
  Property,
  BeforeCreate,
  Enum,
  SerializedPrimaryKey,
  OptionalProps,
  PrimaryKeyProp,
} from '@mikro-orm/core';
import { Book } from './Book';
import { Test } from './test.model';
import { PublisherType } from './PublisherType';

@Entity()
export class Publisher {

  [OptionalProps]?: 'type';
  [PrimaryKeyProp]?: 'id' | '_id';

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name: string;

  @OneToMany({ entity: () => Book, mappedBy: 'publisher' })
  books = new Collection<Book, Publisher>(this);

  @ManyToMany({ entity: () => Test, eager: true })
  tests = new Collection<Test>(this);

  @Enum(() => PublisherType)
  type = PublisherType.LOCAL;

  @Enum(() => PublisherType)
  type2? = PublisherType.LOCAL;

  constructor(name = 'asd', type = PublisherType.LOCAL) {
    this.name = name;
    this.type = type;
  }

  @BeforeCreate()
  beforeCreate() {
    // do sth
  }

}
