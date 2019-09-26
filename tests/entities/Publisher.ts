import { ObjectId } from 'mongodb';
import { Collection, Entity, ManyToMany, OneToMany, PrimaryKey, Property, IEntity, BeforeCreate } from '../../lib';
import { Book } from './Book';
import { Test } from './test.model';

@Entity()
export class Publisher {

  @PrimaryKey()
  _id: ObjectId;

  @Property()
  name: string;

  @OneToMany({ entity: () => Book.name, mappedBy: 'publisher' })
  books = new Collection<Book>(this);

  @ManyToMany({ entity: () => Test.name, owner: true, eager: true })
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

export interface Publisher extends IEntity<string> { }

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}
