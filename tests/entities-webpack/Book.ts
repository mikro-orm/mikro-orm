import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  IdEntity,
  AnyEntity,
} from '../../lib';
import { AuthorWp } from '.';
import { v4 as uuid } from 'uuid';

@Entity({ collection: 'book2' })
export class BookWp implements AnyEntity<BookWp, 'uuid_pk'> {

  @PrimaryKey({ type: 'string' })
  uuid_pk: string = uuid();

  @Property({ type: 'string' })
  title: string;

  @ManyToOne(() => AuthorWp)
  author: AuthorWp;

  constructor(title: string) {
    this.title = title;
  }

}
