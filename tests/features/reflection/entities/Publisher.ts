import { ObjectId } from 'bson';
import { BeforeCreate, Entity, Enum, ManyToMany, OneToMany, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import type { Book } from './Book';
import type { Test } from './Test';
import { Collection } from '../TsMorphMetadataProvider.test';
import { PublisherType } from './PublisherType';

export enum PublisherType2 {
  LOCAL2 = 'local2',
  GLOBAL2 = 'global2',
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

  @Enum()
  types = [PublisherType2.LOCAL2];

  @Enum({ array: true })
  types2 = [PublisherType2.LOCAL2];

  constructor(name = 'asd', type = PublisherType.LOCAL) {
    // this.name = name;
    this.type = type;
  }

  @BeforeCreate()
  beforeCreate() {
    // do sth
  }

}
