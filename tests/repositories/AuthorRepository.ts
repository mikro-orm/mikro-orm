import { EntityRepository } from '@mikro-orm/core';
import { Author } from '../entities';

export class AuthorRepository extends EntityRepository<Author> {

  magic(data: string): string {
    return `111 ${data} 222`;
  }

}
