import { Collection, Entity, ManyToMany, PrimaryKey, Property, ObjectID, IEntity } from '../../lib';
import { Book } from './Book';

@Entity()
export class BookTag {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  name: string;

  @ManyToMany({ entity: () => Book.name, mappedBy: 'tags' })
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

export interface BookTag extends IEntity { }
