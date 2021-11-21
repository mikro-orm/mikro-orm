import { ObjectId } from 'bson';
import { Collection, Entity, ManyToMany, OneToMany, PrimaryKey, Property, BeforeCreate, Enum, SerializedPrimaryKey } from '@mikro-orm/core';
import { Book } from './Book';
import { Test } from './test.model';
import { PublisherType } from './PublisherType';

@Entity()
export class Publisher {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name: string;

  @OneToMany({ entity: () => Book, mappedBy: 'publisher' })
  books = new Collection<Book>(this);

  @ManyToMany({ entity: () => Test, eager: true })
  tests = new Collection<Test>(this);

  @Enum(() => PublisherType)
  type = PublisherType.LOCAL;

  constructor(name = 'asd', type = PublisherType.LOCAL) {
    this.name = name;
    this.type = type;
  }

  @BeforeCreate()
  beforeCreate() {
    // do sth
  }

}
