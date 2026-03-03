import { Entity, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import { Author } from './Author.js';

@Entity()
export class AuthorAddress {
  @OneToOne({ entity: () => Author, primary: true })
  author: Author;

  @Property()
  value: string;

  constructor(author: Author, value: string) {
    this.author = author;
    this.value = value;
  }
}
