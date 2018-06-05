import { EntityRepository } from '../../lib';
import { Author } from '../entities/Author';

export class AuthorRepository extends EntityRepository<Author> {

  public magic(data: string): string {
    return `111 ${data} 222`;
  }

}
