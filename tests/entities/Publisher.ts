import { BaseEntity, Collection, Entity, OneToMany, Property } from '../../lib';
import { Book } from './Book';

@Entity()
export class Publisher extends BaseEntity {

  @Property()
  name: string;

  @OneToMany({ entity: () => Book.name, fk: 'publisher' })
  books: Collection<Book>;

  constructor(name: string) {
    super();
    this.name = name;
  }

}
