import { BaseEntity, Entity, ManyToOne, Property } from '../../lib';
import { Publisher } from './Publisher';
import { Author } from './Author';

@Entity({ collection: 'books-table' })
export class Book extends BaseEntity {

  @Property()
  title: string;

  @ManyToOne({ entity: () => Author.name })
  author: Author;

  @ManyToOne({ entity: () => Publisher.name })
  publisher: Publisher;

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
