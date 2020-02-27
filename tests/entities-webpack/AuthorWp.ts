import { Collection, Entity, OneToMany, Property, PrimaryKey } from '../../lib';
import { BookWp } from '.';

@Entity({ collection: 'author2' })
export class AuthorWp {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  email!: string;

  @Property({ type: 'number' })
  age?: number;

  @OneToMany(() => BookWp, book => book.author)
  books = new Collection<BookWp>(this);

}
