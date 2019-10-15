import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  IdEntity,
} from '../../lib';
import { AuthorWpI } from '.';

@Entity()
export class BookWpI implements IdEntity<BookWpI> {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  title!: string;

  @ManyToOne({ entity: () => AuthorWpI, inversedBy: a => a.books })
  author!: AuthorWpI;

}
