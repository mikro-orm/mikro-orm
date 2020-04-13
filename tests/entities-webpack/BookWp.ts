import { v4 as uuid } from 'uuid';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { AuthorWp } from './index';

@Entity({ tableName: 'book2' })
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
