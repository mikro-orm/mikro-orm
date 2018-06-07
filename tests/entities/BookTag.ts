import { BaseEntity, Collection, Entity, ManyToMany, Property } from '../../lib';
import { Book } from './Book';

@Entity()
export class BookTag extends BaseEntity {

  @Property()
  name: string;

  @ManyToMany({ entity: () => Book.name, mappedBy: 'tags' })
  books: Collection<Book>;

  constructor(name: string) {
    super();
    this.name = name;
  }

}
