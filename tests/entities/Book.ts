import { ObjectID } from 'mongodb';
import { Cascade, Collection, Entity, ManyToMany, ManyToOne, PrimaryKey, Property } from '../../lib';
import { Publisher } from './Publisher';
import { Author } from './Author';
import { BookTag } from './book-tag';
import { BaseEntity3 } from './BaseEntity3';

@Entity({ collection: 'books-table' })
export class Book extends BaseEntity3 {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  @ManyToOne({ cascade: [Cascade.PERSIST, Cascade.REMOVE] })
  publisher: Publisher;

  @ManyToMany({ entity: () => BookTag.name, inversedBy: 'books' })
  tags = new Collection<BookTag>(this);

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
