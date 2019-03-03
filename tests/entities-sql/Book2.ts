import { Collection, Entity, ManyToMany, ManyToOne, Property } from '../../lib';
import { Publisher2 } from './Publisher2';
import { Author2 } from './Author2';
import { BookTag2 } from './BookTag2';
import { BaseEntity2 } from './BaseEntity2';

@Entity()
export class Book2 extends BaseEntity2 {

  @Property()
  title: string;

  @ManyToOne({ cascade: [] })
  author: Author2;

  @ManyToOne({ cascade: [] })
  publisher: Publisher2;

  @ManyToMany({ entity: () => BookTag2.name, inversedBy: 'books', cascade: [] })
  tags: Collection<BookTag2>;

  constructor(title: string, author: Author2) {
    super();
    this.title = title;
    this.author = author;
  }

}
