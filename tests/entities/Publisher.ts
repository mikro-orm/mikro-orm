import {
  Collection,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryKey,
  Property,
  ObjectID,
  IEntity,
  BeforeCreate,
} from '../../lib';
import { Book } from './Book';
import { Test } from './Test';

@Entity()
export class Publisher {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  name: string;

  @OneToMany({ entity: () => Book.name, fk: 'publisher' })
  books = new Collection<Book>(this);

  @ManyToMany({ entity: () => Test.name, owner: true })
  tests = new Collection<Test>(this);

  @Property()
  type: PublisherType = PublisherType.LOCAL;

  constructor(name: string = 'asd', type: PublisherType = PublisherType.LOCAL) {
    this.name = name;
    this.type = type;
  }

  @BeforeCreate()
  beforeCreate() {
    // do sth
  }

}

export interface Publisher extends IEntity { }

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}
