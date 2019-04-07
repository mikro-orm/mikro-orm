import { v4 } from 'uuid';
import { Collection, Entity, IEntity, ManyToMany, ManyToOne, PrimaryKey, Property } from '../../lib';
import { Publisher2 } from './Publisher2';
import { Author2 } from './Author2';
import { BookTag2 } from './BookTag2';

@Entity()
export class Book2 {

  @PrimaryKey({ fieldName: 'uuid_pk', length: 36 })
  uuid = v4();

  @Property({ default: 'CURRENT_TIMESTAMP(3)', length: 3 })
  createdAt = new Date();

  @Property({ nullable: true })
  title: string;

  @Property({ type: 'text', nullable: true })
  perex: string;

  @Property({ type: 'float', nullable: true })
  price: number;

  @Property({ type: 'double', nullable: true })
  double: number;

  @Property({ nullable: true })
  meta: Book2Meta;

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

export interface Book2Meta {
  category: string;
  items: number;
}
