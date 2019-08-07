import { Collection, Entity, ManyToMany, OneToMany, Property } from '../../lib';
import { Book2 } from './Book2';
import { Test2 } from './Test2';
import { BaseEntity2 } from './BaseEntity2';

@Entity()
export class Publisher2 extends BaseEntity2 {

  @Property()
  name: string;

  @OneToMany({ entity: () => Book2, mappedBy: 'publisher' })
  books: Collection<Book2>;

  @ManyToMany({ entity: () => Test2, owner: true })
  tests: Collection<Test2>;

  @Property({ type: 'string', length: 10 })
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
