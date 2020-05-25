import { ObjectId } from 'mongodb';
import { Entity, ManyToMany, OneToMany, PrimaryKey, Property, BeforeCreate, Enum, SerializedPrimaryKey } from '@mikro-orm/core';
import { Book } from './Book';
import { Test } from './Test';
import { Collection } from '../TsMorphMetadataProvider.test';

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}

@Entity()
export class Publisher {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: number;

  @OneToMany({ mappedBy: 'publisher' })
  books = new Collection<Book>(this);

  @ManyToMany({ eager: true })
  tests = new Collection<Test>(this);

  @Enum()
  type = PublisherType.LOCAL;

  constructor(name = 'asd', type = PublisherType.LOCAL) {
    // this.name = name;
    this.type = type;
  }

  @BeforeCreate()
  beforeCreate() {
    // do sth
  }

}
