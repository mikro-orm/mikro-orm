import { Collection, Entity, OneToMany, Property, IdEntity, PrimaryKey } from '../../lib';
import { BookWp } from '.';

@Entity({ collection: 'author2' })
export class AuthorWp implements IdEntity<AuthorWp> {

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
