import { BaseEntity, Collection, Entity, ManyToMany, OneToMany, PrimaryKey, Property, ObjectID } from '../../lib';
import { Book } from './Book';
import { Test } from './Test';

@Entity()
export class Publisher extends BaseEntity {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  name: string;

  @OneToMany({ entity: () => Book.name, fk: 'publisher' })
  books: Collection<Book>;

  @ManyToMany({ entity: () => Test.name, owner: true })
  tests: Collection<Test>;

  @Property()
  type: PublisherType = PublisherType.LOCAL;

  constructor(name: string = 'asd', type: PublisherType = PublisherType.LOCAL) {
    super();
    this.name = name;
    this.type = type;
  }

}

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}
