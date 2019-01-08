import { BaseEntity, Collection, Entity, ManyToMany, PrimaryKey, Property, ObjectID } from '../../lib';
import { Book } from './Book';

@Entity()
export class BookTag extends BaseEntity {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  name: string;

  @ManyToMany({ entity: () => Book.name, mappedBy: 'tags' })
  books: Collection<Book>;

  constructor(name: string) {
    super();
    this.name = name;
  }

}
