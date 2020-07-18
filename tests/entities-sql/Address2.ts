import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { Author2 } from './Author2';

@Entity({ comment: 'This is address table' })
export class Address2 {

  @OneToOne({ entity: () => Author2, primary: true, joinColumn: 'author_id', unique: 'address2_author_id_unique' })
  author: Author2;

  @Property({ comment: 'This is address property' })
  value: string;

  constructor(author: Author2, value: string) {
    this.author = author;
    this.value = value;
  }

}
