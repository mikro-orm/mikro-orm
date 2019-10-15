import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  IdEntity,
  AnyEntity,
} from '../../lib';
import { AuthorWp } from '.';

@Entity({collection: 'book2'})
export class BookWp implements AnyEntity<BookWp, 'uuid_pk'> {

  @PrimaryKey({ type: 'string' })
  uuid_pk: string;

  @Property({ type: 'string' })
  title: string;

  @ManyToOne({ entity: () => AuthorWp, inversedBy: a => a.books })
  author: AuthorWp;

}
