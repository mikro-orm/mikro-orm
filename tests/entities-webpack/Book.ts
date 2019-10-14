import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  IdEntity,
} from '../../lib';
import { AuthorWp } from '.';

@Entity()
export class BookWp implements IdEntity<BookWp> {

  @PrimaryKey({ type: 'number' })
  id: number;

  @Property({ type: 'string' })
  title: string;

  @ManyToOne({ entity: () => AuthorWp, inversedBy: a => a.books })
  author: AuthorWp;

}
