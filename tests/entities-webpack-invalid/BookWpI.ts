import { Entity, ManyToOne, PrimaryKey, Property } from '../../lib';
import { AuthorWpI } from '.';

@Entity()
export class BookWpI {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  title!: string;

  @ManyToOne({ entity: () => AuthorWpI, inversedBy: a => a.books })
  author!: AuthorWpI;

}
