import { BaseEntity, Collection, Entity, OneToMany, Property } from '../../lib';
import { Book } from './Book';

@Entity()
export class Publisher extends BaseEntity {

  @Property()
  name: string;

  @OneToMany({ entity: () => Book.name, fk: 'publisher' })
  books: Collection<Book>;

  @Property()
  type: PublisherType = PublisherType.LOCAL;

  constructor(name: string, type: PublisherType) {
    super();
    this.name = name;
    this.type = type;
  }

}

export enum PublisherType {
  LOCAL = 1,
  GLOBAL = 2,
}
