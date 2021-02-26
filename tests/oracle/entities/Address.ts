import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { Author } from './Author';

@Entity({ comment: 'This is address table' })
export class Address {

  @OneToOne({ entity: () => Author, primary: true, joinColumn: 'author_id', unique: 'address_author_id_unique' })
  author: Author;

  @Property({ comment: 'This is address property' })
  value: string;

  constructor(author: Author, value: string) {
    this.author = author;
    this.value = value;
  }

}
