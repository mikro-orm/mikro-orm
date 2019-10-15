import { Collection, Entity, OneToMany, Property, IdEntity, PrimaryKey } from '../../lib';
import { BookWpI } from './Book';

@Entity()
export class AuthorWpI implements IdEntity<AuthorWpI> {

  @PrimaryKey()
  id: number;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string' })
  email: string;

  @Property({ type: 'number' })
  age?: number;

  @OneToMany({ entity: () => BookWpI, mappedBy: book => book.author })
  books = new Collection<BookWpI>(this);

}
