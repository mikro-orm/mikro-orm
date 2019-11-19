import { ObjectId } from 'mongodb';
import {
  Collection,
  Entity,
  ManyToMany,
  MongoEntity,
  OneToMany,
  PrimaryKey,
  Property,
  BeforeCreate,
  Enum,
} from '../../lib';
import { Book } from './Book';
import { Test } from './test.model';
import { SerializedPrimaryKey } from '../../lib/decorators';

@Entity()
export class Publisher implements MongoEntity<Publisher> {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name: string;

  @OneToMany({ mappedBy: 'publisher' })
  books = new Collection<Book>(this);

  @ManyToMany({ eager: true })
  tests = new Collection<Test>(this);

  @Enum()
  type = PublisherType.LOCAL;

  constructor(name: string = 'asd', type = PublisherType.LOCAL) {
    this.name = name;
    this.type = type;
  }

  @BeforeCreate()
  beforeCreate() {
    // do sth
  }

}

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}
