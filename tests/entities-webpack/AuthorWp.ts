import { Collection, Entity, OneToMany, Property, PrimaryKey } from '@mikro-orm/core';
import { BookWp } from './index.js';

@Entity({ tableName: 'author2' })
export class AuthorWp {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  email!: string;

  @Property({ type: 'number', nullable: true })
  age?: number;

  @OneToMany(() => BookWp, book => book.author)
  books = new Collection<BookWp>(this);

}
