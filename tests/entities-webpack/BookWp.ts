import { v4 as uuid } from 'uuid';
import { Entity, ManyToOne, PrimaryKey, Property } from '../../lib';
import { AuthorWp } from '.';

@Entity({ collection: 'book2' })
export class BookWp {

  @PrimaryKey({ type: 'string', fieldName: 'uuid_pk', length: 36 })
  uuid = uuid();

  @Property({ type: 'string' })
  title: string;

  @ManyToOne(() => AuthorWp)
  author?: AuthorWp;

  constructor(title: string) {
    this.title = title;
  }

}
