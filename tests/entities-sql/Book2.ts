import { v4 } from 'uuid';
import { Collection, Entity, IEntity, ManyToMany, ManyToOne, PrimaryKey, Property } from '../../lib';
import { Publisher2 } from './Publisher2';
import { Author2 } from './Author2';
import { BookTag2 } from './BookTag2';

@Entity()
export class Book2 {

  @PrimaryKey({ fieldName: 'uuid_pk' })
  uuid = v4();

  @Property()
  createdAt = new Date();

  @Property()
  title: string;

  @ManyToOne({ cascade: [] })
  author: Author2;

  @ManyToOne({ cascade: [] })
  publisher: Publisher2;

  @ManyToMany({ entity: () => BookTag2, inversedBy: 'books', cascade: [] })
  tags = new Collection<BookTag2>(this);

  constructor(title: string, author: Author2) {
    this.title = title;
    this.author = author;
  }

}

export interface Book2 extends IEntity<string> { }
