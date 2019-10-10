import { EntityRepository, Repository } from '../../lib';
import { Book } from '../entities';

@Repository(Book)
export class BookRepository extends EntityRepository<Book> {

  magic(data: string): string {
    return `333 ${data} 444`;
  }

}
