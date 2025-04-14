import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { Publisher } from './Publisher.js';
import { BookTag } from './BookTag.js';
import { BaseEntity } from './BaseEntity.js';
import { Author } from './Author.js';

@Entity()
export class Book extends BaseEntity {

  @Property()
  title: string;

  @ManyToOne({ entity: () => Author })
  author: Author;

  @ManyToOne({ entity: () => Publisher, createForeignKeyConstraint: false })
  publisher: Publisher;

  @ManyToMany({ entity: () => BookTag, createForeignKeyConstraint: false })
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author, publisher: Publisher) {
    super();
    this.title = title;
    this.author = author;
    this.publisher = publisher;
  }

}
