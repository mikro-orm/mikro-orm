import { BaseEntity, Collection, Entity, OneToMany, Property } from '../../lib';
import { Book } from './Book';
import { AuthorRepository } from '../repositories/AuthorRepository';

@Entity({ customRepository: AuthorRepository })
export class Author extends BaseEntity {

  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  born: Date;

  @OneToMany({ entity: () => Book.name, fk: 'author', cascade: ['persist', 'remove'] })
  books: Collection<Book>;

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
  }

}
