import {
  BaseEntity,
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  ObjectID,
  IEntity,
} from '../../lib';
import { Publisher } from './Publisher';
import { Author } from './Author';
import { BookTag } from './BookTag';

@Entity({ collection: 'books-table' })
export class Book extends BaseEntity {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  title: string;

  @ManyToOne({ entity: () => Author.name })
  author: Author;

  @ManyToOne({ entity: () => Publisher.name })
  publisher: Publisher;

  @ManyToMany({ entity: () => BookTag.name, inversedBy: 'books' })
  tags: Collection<BookTag>;

  @Property()
  metaObject: object;

  @Property()
  metaArray: any[];

  @Property()
  metaArrayOfStrings: string[];

  constructor(title: string, author: Author) {
    super();
    this.title = title;
    this.author = author;
  }

}
