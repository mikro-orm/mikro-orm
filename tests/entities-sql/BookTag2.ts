import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Book2 } from './Book2.js';

@Entity()
export class BookTag2 {

  @PrimaryKey()
  id!: bigint;

  @Property({ length: 50 })
  name: string;

  @ManyToMany(() => Book2, book => book.tags)
  books = new Collection<Book2>(this);

  @ManyToMany(() => Book2, book => book.tagsUnordered)
  booksUnordered = new Collection<Book2>(this);

  constructor(name: string) {
    this.name = name;
  }

}
